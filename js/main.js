var socket = io('http://localhost:8000');
var camera, controls, scene, renderer, stats;
var light, mesh;
var mixer, morphs = [];
var playerFactory, particle, color, id;
var players = [];
var bullets = [];
var xyzLimit = 500;
var clock = new THREE.Clock();
var textureLoader = new THREE.TextureLoader();
var bulletMap = textureLoader.load("textures/sprite.png");
var loader = new THREE.JSONLoader();

var isLoggedIn = false;
var currentUser = null;
var isRegisterMode = false;
var currentRankingsTab = 'kills';
var rankingsRefreshInterval = null;

var currentRoom = null;
var currentRoomPlayers = [];
var isRoomOwner = false;
var roomsList = [];

var weapons = [
    { id: 1, name: 'Sniper', damage: 100, fireRate: 1000, range: 1000, bulletSpeed: 30, ammo: -1, maxAmmo: -1 },
    { id: 2, name: 'Rocket', damage: 150, fireRate: 2000, range: 500, bulletSpeed: 15, ammo: 5, maxAmmo: 5, explosionRadius: 30 },
    { id: 3, name: 'Melee', damage: 80, fireRate: 333, range: 5, bulletSpeed: 0, ammo: -1, maxAmmo: -1 }
];
var currentWeaponIndex = 0;
var lastFireTime = 0;
var isAiming = false;
var defaultFov = 50;

var replayBuffer = [];
var isReplaying = false;
var isReplayPaused = false;
var replayIndex = 0;
var replayStartTime = 0;
var RECORD_DURATION = 10000;
var replaySpeed = 1;

function getToken() {
    return localStorage.getItem('game_token');
}

function getUser() {
    var userStr = localStorage.getItem('game_user');
    return userStr ? JSON.parse(userStr) : null;
}

function saveAuth(token, user) {
    localStorage.setItem('game_token', token);
    localStorage.setItem('game_user', JSON.stringify(user));
}

function clearAuth() {
    localStorage.removeItem('game_token');
    localStorage.removeItem('game_user');
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
}

function hideError() {
    document.getElementById('error-message').textContent = '';
}

function showRoomError(message) {
    document.getElementById('room-error-message').textContent = message;
}

function hideRoomError() {
    document.getElementById('room-error-message').textContent = '';
}

function switchToRegister() {
    isRegisterMode = true;
    document.getElementById('form-title').textContent = 'Register';
    document.getElementById('submit-btn').textContent = 'Register';
    document.getElementById('toggle-btn').textContent = 'Switch to Login';
    hideError();
}

function switchToLogin() {
    isRegisterMode = false;
    document.getElementById('form-title').textContent = 'Login';
    document.getElementById('submit-btn').textContent = 'Login';
    document.getElementById('toggle-btn').textContent = 'Switch to Register';
    hideError();
}

function handleAuthResponse(response) {
    if (response.token) {
        saveAuth(response.token, {
            userId: response.userId,
            username: response.username || document.getElementById('username').value
        });
        currentUser = getUser();
        isLoggedIn = true;
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('lobby-container').style.display = 'block';
        document.getElementById('lobby-welcome').textContent = 'Welcome, ' + currentUser.username;
        fetchRooms();
    }
}

function handleLoginError(error) {
    if (error.status === 401) {
        showError('Invalid username or password');
    } else {
        showError('Login failed: ' + error.message);
    }
}

function handleRegisterError(error) {
    if (error.status === 409) {
        showError('Username already exists');
    } else {
        showError('Registration failed: ' + error.message);
    }
}

async function submitAuth() {
    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value;

    if (!username || !password) {
        showError('Username and password are required');
        return;
    }

    hideError();

    try {
        var url = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
        var response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        var data = await response.json();

        if (response.ok) {
            handleAuthResponse(data);
        } else {
            if (isRegisterMode) {
                handleRegisterError({ status: response.status, message: data.error });
            } else {
                handleLoginError({ status: response.status, message: data.error });
            }
        }
    } catch (err) {
        showError('Network error, please try again');
    }
}

function logout() {
    clearAuth();
    isLoggedIn = false;
    currentUser = null;
    currentRoom = null;
    currentRoomPlayers = [];
    isRoomOwner = false;
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('lobby-container').style.display = 'none';
    document.getElementById('waiting-lobby').style.display = 'none';
    document.getElementById('game-container').style.display = 'none';
    switchToLogin();
    if (socket) {
        socket.disconnect();
    }
    window.location.reload();
}

function checkAuth() {
    var token = getToken();
    var user = getUser();

    if (token && user) {
        currentUser = user;
        isLoggedIn = true;
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('lobby-container').style.display = 'block';
        document.getElementById('lobby-welcome').textContent = 'Welcome, ' + currentUser.username;
        fetchRooms();
    }
}

async function fetchStats() {
    if (!currentUser || !getToken()) return;

    try {
        var response = await fetch('/api/stats/' + currentUser.userId, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + getToken()
            }
        });

        if (response.ok) {
            var data = await response.json();
            updateStatsUI(data);
        }
    } catch (err) {
        console.error('Failed to fetch stats:', err);
    }
}

function updateStatsUI(stats) {
    document.getElementById('stat-level').textContent = stats.level;
    document.getElementById('stat-kills').textContent = stats.kills;
    document.getElementById('stat-deaths').textContent = stats.deaths;
    document.getElementById('stat-kd').textContent = stats.kdRatio;
    document.getElementById('stat-winrate').textContent = stats.winRate + '%';
}

async function fetchRankings(type) {
    try {
        var response = await fetch('/api/rankings/' + type);
        if (response.ok) {
            var data = await response.json();
            renderRankings(data.data, type);
        }
    } catch (err) {
        console.error('Failed to fetch rankings:', err);
    }
}

function renderRankings(data, type) {
    var container = document.getElementById('rankings-list');
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5); padding: 20px;">No data available</div>';
        return;
    }

    data.forEach(function(item) {
        var rankClass = 'normal';
        if (item.rank === 1) rankClass = 'gold';
        else if (item.rank === 2) rankClass = 'silver';
        else if (item.rank === 3) rankClass = 'bronze';

        var value = item.kills;
        var valueClass = '';
        var detail = 'Deaths: ' + item.deaths + ' | Level: ' + item.level;

        if (type === 'winrate') {
            value = item.winrate + '%';
            valueClass = 'winrate';
        } else if (type === 'level') {
            value = item.level;
            valueClass = 'level';
            detail = 'Kills: ' + item.kills + ' | Deaths: ' + item.deaths;
        }

        var html = `
            <div class="ranking-item">
                <div class="rank-badge ${rankClass}">${item.rank}</div>
                <div class="ranking-info">
                    <div class="ranking-username">${item.username}</div>
                    <div class="ranking-detail">${detail}</div>
                </div>
                <div class="ranking-value ${valueClass}">${value}</div>
            </div>
        `;
        container.innerHTML += html;
    });
}

function toggleRankingsPanel() {
    var panel = document.getElementById('rankings-panel');
    if (panel.classList.contains('show')) {
        panel.classList.remove('show');
        if (rankingsRefreshInterval) {
            clearInterval(rankingsRefreshInterval);
            rankingsRefreshInterval = null;
        }
    } else {
        panel.classList.add('show');
        fetchRankings(currentRankingsTab);
        if (!rankingsRefreshInterval) {
            rankingsRefreshInterval = setInterval(function() {
                fetchRankings(currentRankingsTab);
            }, 30000);
        }
    }
}

function switchRankingsTab(tab) {
    currentRankingsTab = tab;
    document.querySelectorAll('.rankings-tab').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });
    fetchRankings(tab);
}

async function fetchRooms() {
    try {
        var response = await fetch('/api/rooms');
        if (response.ok) {
            var data = await response.json();
            roomsList = data.rooms;
            renderRoomsList();
        }
    } catch (err) {
        console.error('Failed to fetch rooms:', err);
    }
}

function renderRoomsList() {
    var container = document.getElementById('rooms-container');
    container.innerHTML = '';

    if (!roomsList || roomsList.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5); padding: 20px;">No rooms available. Create one!</div>';
        return;
    }

    roomsList.forEach(function(room) {
        var isDisabled = room.status !== 'waiting' || room.owner_id === currentUser.userId;
        var cardClass = isDisabled ? 'room-card disabled' : 'room-card';
        
        var html = `
            <div class="${cardClass}" data-room-id="${room.id}">
                <div class="room-name">${room.name}</div>
                <div class="room-info">
                    <span>Owner: ${room.owner_name}</span>
                    <span>Max Players: ${room.max_players}</span>
                    <span class="room-status ${room.status}">${room.status.toUpperCase()}</span>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });

    document.querySelectorAll('.room-card:not(.disabled)').forEach(function(card) {
        card.addEventListener('click', function() {
            var roomId = parseInt(this.dataset.roomId);
            joinRoom(roomId);
        });
    });
}

async function createRoom() {
    var roomName = document.getElementById('room-name').value.trim();
    var maxPlayers = parseInt(document.getElementById('max-players').value);

    if (!roomName) {
        showRoomError('Room name is required');
        return;
    }

    hideRoomError();

    try {
        var response = await fetch('/api/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getToken()
            },
            body: JSON.stringify({ name: roomName, max_players: maxPlayers })
        });

        var data = await response.json();

        if (response.ok) {
            currentRoom = data;
            isRoomOwner = true;
            document.getElementById('room-name').value = '';
            enterWaitingLobby(data.id, data.name);
        } else {
            showRoomError(data.error || 'Failed to create room');
        }
    } catch (err) {
        showRoomError('Network error, please try again');
    }
}

async function joinRoom(roomId) {
    try {
        var response = await fetch('/api/rooms/' + roomId + '/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getToken()
            }
        });

        var data = await response.json();

        if (response.ok) {
            currentRoom = data.room;
            isRoomOwner = false;
            enterWaitingLobby(data.room.id, data.room.name);
        } else {
            showRoomError(data.error || 'Failed to join room');
            fetchRooms();
        }
    } catch (err) {
        showRoomError('Network error, please try again');
    }
}

function enterWaitingLobby(roomId, roomName) {
    document.getElementById('lobby-container').style.display = 'none';
    document.getElementById('waiting-lobby').style.display = 'flex';
    document.getElementById('waiting-room-name').textContent = roomName;

    if (isRoomOwner) {
        document.getElementById('start-game-btn').style.display = 'block';
    } else {
        document.getElementById('start-game-btn').style.display = 'none';
    }

    socket.emit('joinRoom', { roomId: roomId, username: currentUser.username });
}

async function leaveRoom() {
    if (!currentRoom) return;

    try {
        await fetch('/api/rooms/' + currentRoom.id + '/leave', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + getToken()
            }
        });
    } catch (err) {
        console.error('Failed to leave room:', err);
    }

    currentRoom = null;
    currentRoomPlayers = [];
    isRoomOwner = false;
    document.getElementById('waiting-lobby').style.display = 'none';
    document.getElementById('lobby-container').style.display = 'block';
    fetchRooms();
}

async function startGame() {
    if (!currentRoom || !isRoomOwner) return;

    try {
        var response = await fetch('/api/rooms/' + currentRoom.id + '/start', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + getToken()
            }
        });

        if (response.ok) {
            socket.emit('startGame', { roomId: currentRoom.id });
        }
    } catch (err) {
        console.error('Failed to start game:', err);
    }
}

function renderWaitingPlayers() {
    var container = document.getElementById('waiting-players');
    container.innerHTML = '';

    currentRoomPlayers.forEach(function(player) {
        var isOwner = player.userId === currentRoom.owner_id;
        var isMe = player.userId === currentUser.userId;
        
        var badges = [];
        if (isOwner) badges.push('<span class="player-owner">Owner</span>');
        if (isMe) badges.push('<span class="player-you">You</span>');

        var html = `
            <div class="player-item">
                <div class="player-name">${player.username}</div>
                ${badges.join('')}
            </div>
        `;
        container.innerHTML += html;
    });
}

function enterGame() {
    document.getElementById('waiting-lobby').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    document.getElementById('weapon-panel').style.display = 'block';
    document.getElementById('welcome-text').textContent = 'Welcome, ' + currentUser.username;
    fetchStats();
    updateWeaponUI();
    init();
    animate();
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('submit-btn').addEventListener('click', submitAuth);
    document.getElementById('toggle-btn').addEventListener('click', function() {
        if (isRegisterMode) {
            switchToLogin();
        } else {
            switchToRegister();
        }
    });
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('lobby-logout-btn').addEventListener('click', logout);
    document.getElementById('username').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitAuth();
        }
    });
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitAuth();
        }
    });

    document.getElementById('rankings-btn').addEventListener('click', toggleRankingsPanel);
    document.getElementById('rankings-close-btn').addEventListener('click', toggleRankingsPanel);

    document.querySelectorAll('.rankings-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            switchRankingsTab(this.dataset.tab);
        });
    });

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    document.querySelectorAll('.weapon-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            switchWeapon(parseInt(this.dataset.weapon));
        });
    });

    document.getElementById('create-room-btn').addEventListener('click', createRoom);
    document.getElementById('start-game-btn').addEventListener('click', startGame);
    document.getElementById('leave-room-btn').addEventListener('click', leaveRoom);

    document.getElementById('replay-play-btn').addEventListener('click', toggleReplayPause);
    document.getElementById('replay-exit-btn').addEventListener('click', exitReplay);

    checkAuth();
});

function handleKeyDown(e) {
    if (!isLoggedIn) return;
    if (e.key === 'Escape') {
        if (isReplaying) {
            exitReplay();
            return;
        }
    }
    if (e.key >= '1' && e.key <= '3') {
        switchWeapon(parseInt(e.key) - 1);
    }
}

function handleMouseDown(e) {
    if (!isLoggedIn) return;
    if (e.button === 2) {
        e.preventDefault();
        toggleAim();
    } else if (e.button === 0) {
        fireWeapon();
    }
}

function handleMouseUp(e) {
    if (!isLoggedIn) return;
    if (e.button === 2) {
        toggleAim();
    }
}

function switchWeapon(index) {
    if (index >= 0 && index < weapons.length) {
        currentWeaponIndex = index;
        updateWeaponUI();
        if (isAiming && weapons[index].name !== 'Sniper') {
            toggleAim();
        }
    }
}

function toggleAim() {
    var weapon = weapons[currentWeaponIndex];
    if (weapon.name !== 'Sniper') return;
    
    isAiming = !isAiming;
    if (isAiming) {
        camera.fov = 20;
    } else {
        camera.fov = defaultFov;
    }
    camera.updateProjectionMatrix();
}

function fireWeapon() {
    var now = Date.now();
    var weapon = weapons[currentWeaponIndex];
    
    if (now - lastFireTime < weapon.fireRate) return;
    
    if (weapon.ammo === 0) return;
    
    lastFireTime = now;
    
    if (weapon.ammo > 0) {
        weapon.ammo--;
        updateWeaponUI();
    }
    
    if (weapon.name === 'Melee') {
        meleeAttack();
    } else {
        var speed = camera.getWorldDirection().multiplyScalar(weapon.bulletSpeed);
        AddBullet(camera.position, speed, weapon);
        socket.emit('bullet', [controls.object.position, speed, weapon.id]);
    }
    
    if (isAiming && weapon.name === 'Sniper') {
        toggleAim();
    }
}

function meleeAttack() {
    var weapon = weapons[currentWeaponIndex];
    var direction = camera.getWorldDirection();
    var startPos = camera.position.clone();
    
    for (var playerId in players) {
        if (playerId === id) continue;
        var playerPos = players[playerId].position;
        var distance = startPos.distanceTo(playerPos);
        
        if (distance <= weapon.range) {
            var toPlayer = new THREE.Vector3().subVectors(playerPos, startPos).normalize();
            var dot = direction.dot(toPlayer);
            
            if (dot > 0.7) {
                socket.emit('meleeHit', { target: playerId, damage: weapon.damage });
                break;
            }
        }
    }
}

function updateWeaponUI() {
    var weapon = weapons[currentWeaponIndex];
    var weaponNameEl = document.getElementById('weapon-name');
    var weaponAmmoEl = document.getElementById('weapon-ammo');
    
    if (weaponNameEl) {
        weaponNameEl.textContent = weapon.name;
    }
    if (weaponAmmoEl) {
        weaponAmmoEl.textContent = weapon.ammo === -1 ? '∞' : weapon.ammo + '/' + weapon.maxAmmo;
    }
    
    var weaponTabs = document.querySelectorAll('.weapon-tab');
    weaponTabs.forEach(function(tab, index) {
        tab.classList.remove('active');
        if (index === currentWeaponIndex) {
            tab.classList.add('active');
        }
    });
}

socket.on('init', function (socketID) {
    id = socketID;
    if (currentUser) {
        socket.emit('auth', { userId: currentUser.userId });
    }
});

socket.on('roomJoined', function(data) {
    console.log('Joined room:', data.roomId);
});

socket.on('roomPlayers', function(data) {
    currentRoomPlayers = data.players;
    renderWaitingPlayers();
});

socket.on('gameStarted', function(data) {
    console.log('Game started in room:', data.roomId);
    enterGame();
});

socket.on('player', function (player) {
    if ('online' in player) {
        playerHandler(player.online[0], player.online[1][0], player.online[1][1]);
    } else if ('offline' in player) {
        scene.remove(players[player.offline]);
        delete players[player.offline];
    }
});

socket.on('bullet', function (bullet) {
    var position = new THREE.Vector3(bullet[0].x, bullet[0].y, bullet[0].z);
    var speed = new THREE.Vector3(bullet[1].x, bullet[1].y, bullet[1].z);
    var weaponId = bullet[2] || 1;
    AddBullet(position, speed, weapons[weaponId - 1]);
});

socket.on('rocketExplode', function(data) {
    createExplosion(data.position);
});

socket.on('hit', function (data) {
    if (id == data.hit) {
        var answer = confirm("You are dead, play again?");
        if (answer) {
            window.location.reload();
        } else {
            window.location = "about:blank";
        }
    } else {
        if (id == data.by) {
            console.log("You killed: " + data.hit);
            fetchStats();
            setTimeout(function() {
                startReplay();
            }, 500);
        }
        scene.remove(players[data.hit]);
    }
});

socket.on('connect', function () {
    console.log('Connected');
});

socket.on('disconnect', function () {
    console.log('Disconnected');
});

socket.on('reconnect', function () {
    console.log('Reconnected to server');
});

socket.on('reconnecting', function (nextRetry) {
    console.log('Attempting to re-connect to the server, next attempt in ' + nextRetry + 'ms');
});

socket.on('reconnect_failed', function () {
    console.log('Reconnected to server FAILED.');
});

function init() {
    stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(Math.random() * 600 - 300, 25, Math.random() * 600 - 300);

    scene = new THREE.Scene();

    light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 0.5, 1).normalize();
    scene.add(light);

    var materials = [
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/px.jpg')}),
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/nx.jpg')}),
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/py.jpg')}),
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/ny.jpg')}),
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/pz.jpg')}),
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/nz.jpg')})
    ];
    mesh = new THREE.Mesh(new THREE.BoxGeometry(10000, 10000, 10000, 7, 7, 7), new THREE.MultiMaterial(materials));
    mesh.position.y = 1000;
    mesh.scale.x = -1;
    scene.add(mesh);

    geometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
    geometry.rotateX(-Math.PI / 2);
    for (var i = 0, l = geometry.vertices.length; i < l; i++) {
        var vertex = geometry.vertices[i];
        vertex.x += Math.random() * 20 - 10;
        vertex.y += Math.random() * 2;
        vertex.z += Math.random() * 20 - 10;
    }
    for (var i = 0, l = geometry.faces.length; i < l; i++) {
        var face = geometry.faces[i];
        face.vertexColors[0] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
        face.vertexColors[1] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
        face.vertexColors[2] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
    }
    material = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors, opacity: 0.5, transparent: true});
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    mixer = new THREE.AnimationMixer(scene);
    function addMorph(geometry, speed, duration, x, y, z, fudgeColor) {
        var material = new THREE.MeshLambertMaterial({
            color: 0xffaa55,
            morphTargets: true,
            vertexColors: THREE.FaceColors
        });
        if (fudgeColor) {
            material.color.offsetHSL(0, Math.random() * 0.5 - 0.25, Math.random() * 0.5 - 0.25);
        }
        var mesh = new THREE.Mesh(geometry, material);
        mesh.speed = speed;
        var clip = geometry.animations[0];
        mixer.clipAction(clip, mesh).setDuration(duration).startAt(-duration * Math.random()).play();
        mesh.position.set(x, y, z);
        mesh.rotation.y = Math.PI / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        morphs.push(mesh);
    }
    loader.load("models/animated/stork.js", function (geometry) {
        addMorph(geometry, 350, 1, 500 - Math.random() * 500, 0 + 350, 340, true);
    });
    loader.load("models/animated/parrot.js", function (geometry) {
        addMorph(geometry, 450, 0.5, 500 - Math.random() * 500, 0 + 300, 700, true);
    });

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    controls = new THREE.FirstPersonControls(camera, renderer.domElement);
    controls.movementSpeed = 150;
    controls.lookSpeed = 0.3;
    controls.lookVertical = true;
    window.addEventListener('resize', onWindowResize, false);

    loader.load('./models/skinned/simple/simple.js', function (geometry, materials) {
        for (var k in materials) {
            materials[k].skinning = true;
        }
        playerFactory = new THREE.SkinnedMesh(geometry, new THREE.MultiMaterial(materials));
        playerFactory.scale.set(2.5, 2.5, 2.5);
        playerFactory.position.set(0, 15, 0);
        playerFactory.skeleton.useVertexTexture = false;
        mixer = new THREE.AnimationMixer(playerFactory);
        mixer.clipAction(playerFactory.geometry.animations[0]).play();
    });
}

function animate() {
    if (!isLoggedIn) return;
    stats.begin();
    requestAnimationFrame(animate);
    
    if (!isReplaying) {
        socket.emit('player', [controls.object.position]);
        for (var i = 0; i < bullets.length; i++) {
            var bullet = bullets[i].particle;
            if (bullet) {
                bullet.position.add(bullets[i].speed);
                if (( bullet.position.x >= xyzLimit || bullet.position.x <= -xyzLimit ) ||
                    ( bullet.position.y >= 250 || bullet.position.y <= 0 ) ||
                    ( bullet.position.z >= xyzLimit || bullet.position.z <= -xyzLimit )) {
                    scene.remove(bullets[i].particle);
                    bullets.splice(i, 1);
                }
                bullet.verticesNeedUpdate = true;
            }
        }
        restrictField(controls, xyzLimit);
        recordState();
    }
    
    render();
    stats.end();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
}

function render() {
    var delta = clock.getDelta();
    for (var i = 0; i < morphs.length; i++) {
        morph = morphs[i];
        morph.position.x += morph.speed * delta;
        if (morph.position.x > 2000) {
            morph.position.x = -1000 - Math.random() * 500;
        }
    }
    controls.update(delta);
    if (mixer) mixer.update(delta);
    renderer.render(scene, camera);
}

function restrictField(controls, restrict) {
    if (controls.object.position.x > restrict) {
        controls.object.position.x = restrict;
    }
    if (controls.object.position.x < -restrict) {
        controls.object.position.x = -restrict;
    }
    controls.object.position.y = 25;
    if (controls.object.position.z > restrict) {
        controls.object.position.z = restrict;
    }
    if (controls.object.position.z < -restrict) {
        controls.object.position.z = -restrict;
    }
}

function playerHandler(id, position) {
    if (!players[id]) {
        addPlayer(id, position.x, position.y, position.z);
    } else {
        updatePlayer(id, position.x, position.y, position.z);
    }
}

function addPlayer(id, x, y, z) {
    var playerMesh = playerFactory.clone();
    playerMesh.position.set(x, y, z);
    scene.add(playerMesh);
    mixer = new THREE.AnimationMixer(playerMesh);
    mixer.clipAction(playerMesh.geometry.animations[0]).play();
    players[id] = playerMesh;
}

function updatePlayer(id, x, y, z) {
    var playerMesh = players[id];
    playerMesh.position.set(x, y, z);
}

function AddBullet(position, speed, weapon) {
    var color = 0xffffff;
    var scale = 1.5;
    
    if (weapon && weapon.name === 'Rocket') {
        color = 0xff4400;
        scale = 2.5;
    } else if (weapon && weapon.name === 'Melee') {
        return;
    }
    
    particle = new THREE.Sprite(new THREE.SpriteMaterial({map: bulletMap, color: color, fog: true}));
    particle.position.x = position.x;
    particle.position.y = position.y;
    particle.position.z = position.z;
    particle.scale.x = particle.scale.y = scale;
    
    var bullet = new Bullet(particle, speed, weapon);
    bullets.push(bullet);
    scene.add(particle);
    
    if (weapon && weapon.name === 'Rocket') {
        setTimeout(function() {
            bullet.explode();
        }, 2000);
    }
}

function Bullet(particle, speed, weapon) {
    this.particle = particle;
    this.speed = speed;
    this.weapon = weapon;
    this.exploded = false;
    
    this.explode = function() {
        if (this.exploded || !this.particle) return;
        this.exploded = true;
        
        var pos = this.particle.position;
        createExplosion(pos);
        
        scene.remove(this.particle);
        var index = bullets.indexOf(this);
        if (index > -1) {
            bullets.splice(index, 1);
        }
        
        if (this.weapon && this.weapon.name === 'Rocket') {
            socket.emit('rocketExplode', { position: { x: pos.x, y: pos.y, z: pos.z } });
        }
    };
    
    return this;
}

function createExplosion(position) {
    var geometry = new THREE.SphereGeometry(5, 16, 16);
    var material = new THREE.MeshBasicMaterial({color: 0xff4400, transparent: true, opacity: 1});
    var explosion = new THREE.Mesh(geometry, material);
    explosion.position.set(position.x, position.y, position.z);
    scene.add(explosion);
    
    var scale = 1;
    var animateExplosion = function() {
        scale += 0.5;
        explosion.scale.set(scale, scale, scale);
        material.opacity -= 0.1;
        
        if (material.opacity > 0) {
            requestAnimationFrame(animateExplosion);
        } else {
            scene.remove(explosion);
        }
    };
    animateExplosion();
}

function recordState() {
    if (isReplaying) return;
    
    var now = Date.now();
    
    var bulletsSnapshot = [];
    for (var i = 0; i < bullets.length; i++) {
        var bullet = bullets[i];
        bulletsSnapshot.push({
            position: {
                x: bullet.particle.position.x,
                y: bullet.particle.position.y,
                z: bullet.particle.position.z
            },
            speed: {
                x: bullet.speed.x,
                y: bullet.speed.y,
                z: bullet.speed.z
            },
            weapon: bullet.weapon ? { id: bullet.weapon.id, name: bullet.weapon.name } : null,
            exploded: bullet.exploded
        });
    }
    
    var state = {
        timestamp: now,
        cameraPosition: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        },
        cameraQuaternion: {
            x: camera.quaternion.x,
            y: camera.quaternion.y,
            z: camera.quaternion.z,
            w: camera.quaternion.w
        },
        controlsPosition: {
            x: controls.object.position.x,
            y: controls.object.position.y,
            z: controls.object.position.z
        },
        controlsRotation: {
            x: controls.object.rotation.x,
            y: controls.object.rotation.y,
            z: controls.object.rotation.z
        },
        isAiming: isAiming,
        currentWeaponIndex: currentWeaponIndex,
        bullets: bulletsSnapshot
    };
    
    replayBuffer.push(state);
    
    while (replayBuffer.length > 0 && now - replayBuffer[0].timestamp > RECORD_DURATION) {
        replayBuffer.shift();
    }
}

function startReplay() {
    if (replayBuffer.length < 2) return;
    
    isReplaying = true;
    isReplayPaused = false;
    replayIndex = 0;
    replayStartTime = Date.now();
    
    document.getElementById('replay-panel').style.display = 'block';
    document.getElementById('replay-overlay').style.display = 'block';
    document.getElementById('replay-play-btn').textContent = '⏸ Pause';
    
    replayLoop();
}

function stopReplay() {
    isReplaying = false;
    isReplayPaused = false;
    
    document.getElementById('replay-panel').style.display = 'none';
    document.getElementById('replay-overlay').style.display = 'none';
    
    for (var i = 0; i < bullets.length; i++) {
        scene.remove(bullets[i].particle);
    }
    bullets = [];
    
    camera.position.set(controls.object.position.x, controls.object.position.y, controls.object.position.z);
    camera.quaternion.copy(controls.object.quaternion);
    camera.fov = isAiming ? 20 : defaultFov;
    camera.updateProjectionMatrix();
}

function toggleReplayPause() {
    isReplayPaused = !isReplayPaused;
    var btn = document.getElementById('replay-play-btn');
    btn.textContent = isReplayPaused ? '▶ Play' : '⏸ Pause';
    
    if (!isReplayPaused && isReplaying) {
        replayStartTime = Date.now() - (replayBuffer[replayIndex].timestamp - replayBuffer[0].timestamp);
        replayLoop();
    }
}

function exitReplay() {
    stopReplay();
}

function replayLoop() {
    if (!isReplaying || isReplayPaused) return;
    
    var elapsed = (Date.now() - replayStartTime) * replaySpeed;
    var targetTimestamp = replayBuffer[0].timestamp + elapsed;
    
    while (replayIndex < replayBuffer.length - 1 && replayBuffer[replayIndex + 1].timestamp <= targetTimestamp) {
        replayIndex++;
    }
    
    if (replayIndex >= replayBuffer.length - 1) {
        stopReplay();
        return;
    }
    
    var state = replayBuffer[replayIndex];
    
    camera.position.set(state.cameraPosition.x, state.cameraPosition.y, state.cameraPosition.z);
    camera.quaternion.set(state.cameraQuaternion.x, state.cameraQuaternion.y, state.cameraQuaternion.z, state.cameraQuaternion.w);
    camera.fov = state.isAiming ? 20 : defaultFov;
    camera.updateProjectionMatrix();
    
    controls.object.position.set(state.controlsPosition.x, state.controlsPosition.y, state.controlsPosition.z);
    controls.object.rotation.set(state.controlsRotation.x, state.controlsRotation.y, state.controlsRotation.z);
    
    for (var i = 0; i < bullets.length; i++) {
        scene.remove(bullets[i].particle);
    }
    bullets = [];
    
    for (var j = 0; j < state.bullets.length; j++) {
        var bulletData = state.bullets[j];
        if (bulletData.exploded) continue;
        
        var bulletSpeed = new THREE.Vector3(bulletData.speed.x, bulletData.speed.y, bulletData.speed.z);
        var weapon = weapons.find(function(w) { return w.id === bulletData.weapon.id; }) || weapons[0];
        
        var color = 0xffffff;
        var scale = 1.5;
        
        if (weapon && weapon.name === 'Rocket') {
            color = 0xff4400;
            scale = 2.5;
        }
        
        var particle = new THREE.Sprite(new THREE.SpriteMaterial({map: bulletMap, color: color, fog: true}));
        particle.position.set(bulletData.position.x, bulletData.position.y, bulletData.position.z);
        particle.scale.x = particle.scale.y = scale;
        
        var bullet = new Bullet(particle, bulletSpeed, weapon);
        bullets.push(bullet);
        scene.add(particle);
    }
    
    var progress = (replayIndex / (replayBuffer.length - 1)) * 100;
    document.getElementById('replay-progress').value = progress;
    document.getElementById('replay-time').textContent = formatTime(elapsed);
    
    requestAnimationFrame(replayLoop);
}

function formatTime(ms) {
    var seconds = Math.floor(ms / 1000);
    var minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    var milliseconds = Math.floor((ms % 1000) / 10);
    return minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0') + '.' + milliseconds.toString().padStart(2, '0');
}
