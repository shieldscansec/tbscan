// Sistema de Empregos
new gJobNPCs[MAX_JOBS];
new gJobPickups[MAX_JOBS];
new gJobLabels[MAX_JOBS];

// Coordenadas dos NPCs de emprego
new Float:gJobPositions[MAX_JOBS][3] = {
    {2027.0, -1280.0, 23.9}, // Policial
    {2027.0, -1285.0, 23.9}, // Médico
    {2027.0, -1290.0, 23.9}, // Taxista
    {2027.0, -1295.0, 23.9}, // Mecânico
    {2027.0, -1300.0, 23.9}  // Vendedor
};

new gJobNames[MAX_JOBS][32] = {
    "Policial",
    "Médico", 
    "Taxista",
    "Mecânico",
    "Vendedor"
};

new gJobSalaries[MAX_JOBS] = {
    5000, // Policial
    4000, // Médico
    3000, // Taxista
    3500, // Mecânico
    2500  // Vendedor
};

CreateJobSystem() {
    for(new i = 0; i < MAX_JOBS; i++) {
        // Criar NPC
        gJobNPCs[i] = CreateActor(280, gJobPositions[i][0], gJobPositions[i][1], gJobPositions[i][2], 0.0);
        
        // Criar pickup
        gJobPickups[i] = CreatePickup(1239, 1, gJobPositions[i][0], gJobPositions[i][1], gJobPositions[i][2]);
        
        // Criar label 3D
        new label[128];
        format(label, sizeof(label), "Emprego: %s\nPressione F para conversar\nSalário: $%d", gJobNames[i], gJobSalaries[i]);
        gJobLabels[i] = Create3DTextLabel(label, COLOR_YELLOW, gJobPositions[i][0], gJobPositions[i][1], gJobPositions[i][2] + 1.0, 10.0, 0);
    }
}

public OnPlayerPickUpPickup(playerid, pickupid) {
    for(new i = 0; i < MAX_JOBS; i++) {
        if(pickupid == gJobPickups[i]) {
            ShowPlayerDialog(playerid, DIALOG_JOB_APPLY, DIALOG_STYLE_MSGBOX, "Candidatura", 
                "Deseja se candidatar para o emprego de %s?\n\nSalário: $%d\nHorário: 8h por dia", 
                gJobNames[i], gJobSalaries[i], "Sim", "Não");
            return 1;
        }
    }
    return 1;
}

public OnPlayerKeyStateChange(playerid, newkeys, oldkeys) {
    if(!PlayerData[playerid][pLogged] || !PlayerData[playerid][pSpawned]) return 1;
    
    if(PRESSED(KEY_SECONDARY_ATTACK)) { // Tecla F
        new Float:x, Float:y, Float:z;
        GetPlayerPos(playerid, x, y, z);
        
        for(new i = 0; i < MAX_JOBS; i++) {
            if(IsPlayerInRangeOfPoint(playerid, 2.0, gJobPositions[i][0], gJobPositions[i][1], gJobPositions[i][2])) {
                ShowPlayerDialog(playerid, DIALOG_JOB_APPLY, DIALOG_STYLE_MSGBOX, "Candidatura", 
                    "Deseja se candidatar para o emprego de %s?\n\nSalário: $%d\nHorário: 8h por dia", 
                    gJobNames[i], gJobSalaries[i], "Sim", "Não");
                return 1;
            }
        }
    }
    return 1;
}

// Comando para listar empregos
YCMD:empregos(playerid, params[], help) {
    if(help) {
        SendClientMessage(playerid, COLOR_YELLOW, "Lista os empregos disponíveis.");
        return 1;
    }
    
    if(!PlayerData[playerid][pLogged] || !PlayerData[playerid][pSpawned]) {
        SendClientMessage(playerid, COLOR_RED, "Você precisa estar logado para ver os empregos!");
        return 1;
    }
    
    SendClientMessage(playerid, COLOR_WHITE, "=== EMPREGOS DISPONÍVEIS ===");
    for(new i = 0; i < MAX_JOBS; i++) {
        new string[128];
        format(string, sizeof(string), "%s - Salário: $%d", gJobNames[i], gJobSalaries[i]);
        SendClientMessage(playerid, COLOR_GRAY, string);
    }
    SendClientMessage(playerid, COLOR_YELLOW, "Vá até um NPC de emprego e pressione F para se candidatar!");
    return 1;
}

// Comando para trabalhar
YCMD:trabalhar(playerid, params[], help) {
    if(help) {
        SendClientMessage(playerid, COLOR_YELLOW, "Inicia seu trabalho atual.");
        return 1;
    }
    
    if(!PlayerData[playerid][pLogged] || !PlayerData[playerid][pSpawned]) {
        SendClientMessage(playerid, COLOR_RED, "Você precisa estar logado para trabalhar!");
        return 1;
    }
    
    if(PlayerData[playerid][pJob] == 0) {
        SendClientMessage(playerid, COLOR_RED, "Você não tem emprego! Procure um NPC de emprego.");
        return 1;
    }
    
    new jobid = PlayerData[playerid][pJob] - 1;
    if(jobid >= 0 && jobid < MAX_JOBS) {
        PlayerData[playerid][pMoney] += gJobSalaries[jobid];
        PlayerData[playerid][pExp] += 10;
        
        new string[128];
        format(string, sizeof(string), "Você trabalhou como %s e ganhou $%d!", gJobNames[jobid], gJobSalaries[jobid]);
        SendClientMessage(playerid, COLOR_GREEN, string);
        
        UpdateHUD(playerid);
    }
    
    return 1;
}

// Comando para demitir
YCMD:demitir(playerid, params[], help) {
    if(help) {
        SendClientMessage(playerid, COLOR_YELLOW, "Demite-se do seu emprego atual.");
        return 1;
    }
    
    if(!PlayerData[playerid][pLogged] || !PlayerData[playerid][pSpawned]) {
        SendClientMessage(playerid, COLOR_RED, "Você precisa estar logado para se demitir!");
        return 1;
    }
    
    if(PlayerData[playerid][pJob] == 0) {
        SendClientMessage(playerid, COLOR_RED, "Você não tem emprego!");
        return 1;
    }
    
    new jobid = PlayerData[playerid][pJob] - 1;
    PlayerData[playerid][pJob] = 0;
    PlayerData[playerid][pJobLevel] = 1;
    
    new string[128];
    format(string, sizeof(string), "Você se demitiu do emprego de %s!", gJobNames[jobid]);
    SendClientMessage(playerid, COLOR_ORANGE, string);
    
    return 1;
}