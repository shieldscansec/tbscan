// Sistema Anti-Cheat Básico
new Float:gPlayerLastPos[MAX_PLAYERS][3];
new gPlayerLastHealth[MAX_PLAYERS];
new gPlayerLastArmor[MAX_PLAYERS];
new gPlayerSpeedWarnings[MAX_PLAYERS];
new gPlayerTeleportWarnings[MAX_PLAYERS];
new gPlayerGodModeWarnings[MAX_PLAYERS];

#define MAX_SPEED 200.0
#define MAX_TELEPORT_DISTANCE 50.0
#define MAX_WARNINGS 3

public OnPlayerUpdate(playerid) {
    if(!PlayerData[playerid][pLogged] || !PlayerData[playerid][pSpawned]) return 1;
    
    new Float:x, Float:y, Float:z;
    GetPlayerPos(playerid, x, y, z);
    
    // Anti Speed Hack
    new Float:distance = GetDistanceBetweenPoints(gPlayerLastPos[playerid][0], gPlayerLastPos[playerid][1], gPlayerLastPos[playerid][2], x, y, z);
    if(distance > MAX_SPEED) {
        gPlayerSpeedWarnings[playerid]++;
        if(gPlayerSpeedWarnings[playerid] >= MAX_WARNINGS) {
            Kick(playerid);
            return 0;
        }
        SendClientMessage(playerid, COLOR_RED, "Speed hack detectado! Aviso %d/%d", gPlayerSpeedWarnings[playerid], MAX_WARNINGS);
    }
    
    // Anti Teleport Hack
    if(distance > MAX_TELEPORT_DISTANCE) {
        gPlayerTeleportWarnings[playerid]++;
        if(gPlayerTeleportWarnings[playerid] >= MAX_WARNINGS) {
            Kick(playerid);
            return 0;
        }
        SendClientMessage(playerid, COLOR_RED, "Teleport hack detectado! Aviso %d/%d", gPlayerTeleportWarnings[playerid], MAX_WARNINGS);
        SetPlayerPos(playerid, gPlayerLastPos[playerid][0], gPlayerLastPos[playerid][1], gPlayerLastPos[playerid][2]);
        return 0;
    }
    
    // Anti God Mode
    new Float:health = GetPlayerHealth(playerid);
    new Float:armor = GetPlayerArmour(playerid);
    
    if(health > 100.0 || armor > 100.0) {
        gPlayerGodModeWarnings[playerid]++;
        if(gPlayerGodModeWarnings[playerid] >= MAX_WARNINGS) {
            Kick(playerid);
            return 0;
        }
        SendClientMessage(playerid, COLOR_RED, "God mode detectado! Aviso %d/%d", gPlayerGodModeWarnings[playerid], MAX_WARNINGS);
        SetPlayerHealth(playerid, 100.0);
        SetPlayerArmour(playerid, 0.0);
        return 0;
    }
    
    // Atualizar posições
    gPlayerLastPos[playerid][0] = x;
    gPlayerLastPos[playerid][1] = y;
    gPlayerLastPos[playerid][2] = z;
    gPlayerLastHealth[playerid] = floatround(health);
    gPlayerLastArmor[playerid] = floatround(armor);
    
    return 1;
}

public OnPlayerSpawn(playerid) {
    if(!PlayerData[playerid][pLogged]) return 0;
    
    // Resetar warnings do anti-cheat
    gPlayerSpeedWarnings[playerid] = 0;
    gPlayerTeleportWarnings[playerid] = 0;
    gPlayerGodModeWarnings[playerid] = 0;
    
    // Salvar posição inicial
    GetPlayerPos(playerid, gPlayerLastPos[playerid][0], gPlayerLastPos[playerid][1], gPlayerLastPos[playerid][2]);
    gPlayerLastHealth[playerid] = 100;
    gPlayerLastArmor[playerid] = 0;
    
    return 1;
}

// Função para verificar se jogador está usando hacks
CheckPlayerHacks(playerid) {
    if(!PlayerData[playerid][pLogged] || !PlayerData[playerid][pSpawned]) return 0;
    
    new Float:x, Float:y, Float:z;
    GetPlayerPos(playerid, x, y, z);
    
    // Verificar velocidade
    new Float:distance = GetDistanceBetweenPoints(gPlayerLastPos[playerid][0], gPlayerLastPos[playerid][1], gPlayerLastPos[playerid][2], x, y, z);
    if(distance > MAX_SPEED) {
        return 1; // Speed hack
    }
    
    // Verificar teleport
    if(distance > MAX_TELEPORT_DISTANCE) {
        return 2; // Teleport hack
    }
    
    // Verificar god mode
    new Float:health = GetPlayerHealth(playerid);
    new Float:armor = GetPlayerArmour(playerid);
    
    if(health > 100.0 || armor > 100.0) {
        return 3; // God mode
    }
    
    return 0; // Sem hacks detectados
}