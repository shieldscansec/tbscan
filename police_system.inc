// Sistema de Polícia
#define MAX_FINES 100
#define JAIL_TIME_MULTIPLIER 60 // 1 minuto por $1000 de multa

enum E_FINE_DATA {
    fID,
    fPlayer[MAX_PLAYER_NAME],
    fOfficer[MAX_PLAYER_NAME],
    fAmount,
    fReason[128],
    fDate[32],
    bool:fPaid
}

new FineData[MAX_FINES][E_FINE_DATA];
new gFineCount = 0;

// Comando para multar
YCMD:multar(playerid, params[], help) {
    if(help) {
        SendClientMessage(playerid, COLOR_YELLOW, "Multa um jogador (apenas policiais).");
        return 1;
    }
    
    if(!PlayerData[playerid][pLogged] || !PlayerData[playerid][pSpawned]) {
        SendClientMessage(playerid, COLOR_RED, "Você precisa estar logado para multar!");
        return 1;
    }
    
    if(PlayerData[playerid][pJob] != 1) { // 1 = Policial
        SendClientMessage(playerid, COLOR_RED, "Apenas policiais podem multar!");
        return 1;
    }
    
    new targetid, amount, reason[128];
    if(sscanf(params, "uis[128]", targetid, amount, reason)) {
        SendClientMessage(playerid, COLOR_YELLOW, "Uso: /multar [id] [valor] [motivo]");
        return 1;
    }
    
    if(!IsPlayerConnected(targetid)) {
        SendClientMessage(playerid, COLOR_RED, "Jogador não encontrado!");
        return 1;
    }
    
    if(!PlayerData[targetid][pLogged] || !PlayerData[targetid][pSpawned]) {
        SendClientMessage(playerid, COLOR_RED, "Jogador não está logado!");
        return 1;
    }
    
    if(amount < 1 || amount > 100000) {
        SendClientMessage(playerid, COLOR_RED, "Valor da multa deve ser entre $1 e $100,000!");
        return 1;
    }
    
    // Aplicar multa
    PlayerData[targetid][pFine] += amount;
    
    // Salvar multa no sistema
    if(gFineCount < MAX_FINES) {
        FineData[gFineCount][fID] = gFineCount;
        strcpy(FineData[gFineCount][fPlayer], PlayerData[targetid][pName], MAX_PLAYER_NAME);
        strcpy(FineData[gFineCount][fOfficer], PlayerData[playerid][pName], MAX_PLAYER_NAME);
        FineData[gFineCount][fAmount] = amount;
        strcpy(FineData[gFineCount][fReason], reason, 128);
        format(FineData[gFineCount][fDate], 32, "%d/%d/%d", 1, 1, 2024);
        FineData[gFineCount][fPaid] = false;
        gFineCount++;
    }
    
    new string[256];
    format(string, sizeof(string), "Você multou %s por $%d. Motivo: %s", PlayerData[targetid][pName], amount, reason);
    SendClientMessage(playerid, COLOR_GREEN, string);
    
    format(string, sizeof(string), "Você foi multado por $%d por %s. Motivo: %s", amount, PlayerData[playerid][pName], reason);
    SendClientMessage(targetid, COLOR_RED, string);
    
    return 1;
}

// Comando para prender
YCMD:prender(playerid, params[], help) {
    if(help) {
        SendClientMessage(playerid, COLOR_YELLOW, "Prende um jogador (apenas policiais).");
        return 1;
    }
    
    if(!PlayerData[playerid][pLogged] || !PlayerData[playerid][pSpawned]) {
        SendClientMessage(playerid, COLOR_RED, "Você precisa estar logado para prender!");
        return 1;
    }
    
    if(PlayerData[playerid][pJob] != 1) { // 1 = Policial
        SendClientMessage(playerid, COLOR_RED, "Apenas policiais podem prender!");
        return 1;
    }
    
    new targetid, time, reason[128];
    if(sscanf(params, "uis[128]", targetid, time, reason)) {
        SendClientMessage(playerid, COLOR_YELLOW, "Uso: /prender [id] [tempo] [motivo]");
        return 1;
    }
    
    if(!IsPlayerConnected(targetid)) {
        SendClientMessage(playerid, COLOR_RED, "Jogador não encontrado!");
        return 1;
    }
    
    if(!PlayerData[targetid][pLogged] || !PlayerData[targetid][pSpawned]) {
        SendClientMessage(playerid, COLOR_RED, "Jogador não está logado!");
        return 1;
    }
    
    if(time < 1 || time > 60) {
        SendClientMessage(playerid, COLOR_RED, "Tempo de prisão deve ser entre 1 e 60 minutos!");
        return 1;
    }
    
    // Prender jogador
    PlayerData[targetid][pJailTime] = time;
    SetPlayerPos(targetid, 264.4, 77.6, 1001.6); // Célula
    SetPlayerInterior(targetid, 6);
    SetPlayerVirtualWorld(targetid, 0);
    
    new string[256];
    format(string, sizeof(string), "Você prendeu %s por %d minutos. Motivo: %s", PlayerData[targetid][pName], time, reason);
    SendClientMessage(playerid, COLOR_GREEN, string);
    
    format(string, sizeof(string), "Você foi preso por %d minutos por %s. Motivo: %s", time, PlayerData[playerid][pName], reason);
    SendClientMessage(targetid, COLOR_RED, string);
    
    return 1;
}

// Comando para verificar identidade
YCMD:verificar(playerid, params[], help) {
    if(help) {
        SendClientMessage(playerid, COLOR_YELLOW, "Verifica a identidade de um jogador (apenas policiais).");
        return 1;
    }
    
    if(!PlayerData[playerid][pLogged] || !PlayerData[playerid][pSpawned]) {
        SendClientMessage(playerid, COLOR_RED, "Você precisa estar logado para verificar!");
        return 1;
    }
    
    if(PlayerData[playerid][pJob] != 1) { // 1 = Policial
        SendClientMessage(playerid, COLOR_RED, "Apenas policiais podem verificar identidade!");
        return 1;
    }
    
    new targetid;
    if(sscanf(params, "u", targetid)) {
        SendClientMessage(playerid, COLOR_YELLOW, "Uso: /verificar [id]");
        return 1;
    }
    
    if(!IsPlayerConnected(targetid)) {
        SendClientMessage(playerid, COLOR_RED, "Jogador não encontrado!");
        return 1;
    }
    
    if(!PlayerData[targetid][pLogged] || !PlayerData[targetid][pSpawned]) {
        SendClientMessage(playerid, COLOR_RED, "Jogador não está logado!");
        return 1;
    }
    
    // Mostrar dados do jogador
    new string[512];
    format(string, sizeof(string), "=== IDENTIDADE ===\nNome: %s\nTelefone: %s\nEmprego: %s\nNível: %d\nDinheiro: $%d\nMultas Pendentes: $%d\nTempo de Prisão: %d min", 
        PlayerData[targetid][pName], 
        PlayerData[targetid][pPhoneNumber],
        (PlayerData[targetid][pJob] == 0) ? ("Desempregado") : (gJobNames[PlayerData[targetid][pJob]-1]),
        PlayerData[targetid][pLevel],
        PlayerData[targetid][pMoney],
        PlayerData[targetid][pFine],
        PlayerData[targetid][pJailTime]
    );
    ShowPlayerDialog(playerid, DIALOG_INFO, DIALOG_STYLE_MSGBOX, "Verificação de Identidade", string, "OK", "");
    
    return 1;
}

// Comando para pagar multa
YCMD:pagarmulta(playerid, params[], help) {
    if(help) {
        SendClientMessage(playerid, COLOR_YELLOW, "Paga suas multas pendentes.");
        return 1;
    }
    
    if(!PlayerData[playerid][pLogged] || !PlayerData[playerid][pSpawned]) {
        SendClientMessage(playerid, COLOR_RED, "Você precisa estar logado para pagar multas!");
        return 1;
    }
    
    if(PlayerData[playerid][pFine] <= 0) {
        SendClientMessage(playerid, COLOR_RED, "Você não tem multas pendentes!");
        return 1;
    }
    
    if(PlayerData[playerid][pMoney] < PlayerData[playerid][pFine]) {
        SendClientMessage(playerid, COLOR_RED, "Você não tem dinheiro suficiente para pagar as multas!");
        return 1;
    }
    
    new amount = PlayerData[playerid][pFine];
    PlayerData[playerid][pMoney] -= amount;
    PlayerData[playerid][pFine] = 0;
    
    new string[128];
    format(string, sizeof(string), "Você pagou $%d em multas!", amount);
    SendClientMessage(playerid, COLOR_GREEN, string);
    
    UpdateHUD(playerid);
    return 1;
}

// Timer para reduzir tempo de prisão
public UpdateJailTime(playerid) {
    if(!PlayerData[playerid][pLogged] || !PlayerData[playerid][pSpawned]) return 0;
    
    if(PlayerData[playerid][pJailTime] > 0) {
        PlayerData[playerid][pJailTime]--;
        
        if(PlayerData[playerid][pJailTime] <= 0) {
            // Soltar da prisão
            SetPlayerPos(playerid, 1958.3783, -1714.2943, 13.6406);
            SetPlayerInterior(playerid, 0);
            SetPlayerVirtualWorld(playerid, 0);
            SendClientMessage(playerid, COLOR_GREEN, "Você foi solto da prisão!");
        } else {
            new string[128];
            format(string, sizeof(string), "Tempo restante na prisão: %d minutos", PlayerData[playerid][pJailTime]);
            SendClientMessage(playerid, COLOR_ORANGE, string);
        }
    }
    
    return 1;
}