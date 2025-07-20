// Sistema de Celular
new Text:gPhoneBackground;
new Text:gPhoneApps[10];
new Text:gPhoneClose;
new bool:gPlayerPhoneOpen[MAX_PLAYERS];

CreatePhoneTextDraws() {
    // Background do celular
    gPhoneBackground = TextDrawCreate(200.0, 100.0, "LD_SPAC:white");
    TextDrawLetterSize(gPhoneBackground, 0.0, 0.0);
    TextDrawTextSize(gPhoneBackground, 240.0, 300.0);
    TextDrawAlignment(gPhoneBackground, 0);
    TextDrawColor(gPhoneBackground, 0x000000FF);
    TextDrawSetShadow(gPhoneBackground, 0);
    TextDrawSetOutline(gPhoneBackground, 0);
    TextDrawBackgroundColor(gPhoneBackground, 0x000000FF);
    TextDrawFont(gPhoneBackground, 4);
    TextDrawSetProportional(gPhoneBackground, 0);
    TextDrawSetSelectable(gPhoneBackground, 0);
    
    // Apps do celular
    gPhoneApps[0] = TextDrawCreate(220.0, 120.0, "BANCO");
    TextDrawLetterSize(gPhoneApps[0], 0.4, 1.5);
    TextDrawAlignment(gPhoneApps[0], 1);
    TextDrawColor(gPhoneApps[0], COLOR_WHITE);
    TextDrawSetShadow(gPhoneApps[0], 0);
    TextDrawSetOutline(gPhoneApps[0], 1);
    TextDrawBackgroundColor(gPhoneApps[0], 0x00FF00AA);
    TextDrawFont(gPhoneApps[0], 2);
    TextDrawSetProportional(gPhoneApps[0], 1);
    TextDrawSetSelectable(gPhoneApps[0], 1);
    
    gPhoneApps[1] = TextDrawCreate(320.0, 120.0, "PIX");
    TextDrawLetterSize(gPhoneApps[1], 0.4, 1.5);
    TextDrawAlignment(gPhoneApps[1], 1);
    TextDrawColor(gPhoneApps[1], COLOR_WHITE);
    TextDrawSetShadow(gPhoneApps[1], 0);
    TextDrawSetOutline(gPhoneApps[1], 1);
    TextDrawBackgroundColor(gPhoneApps[1], 0x0080FFAA);
    TextDrawFont(gPhoneApps[1], 2);
    TextDrawSetProportional(gPhoneApps[1], 1);
    TextDrawSetSelectable(gPhoneApps[1], 1);
    
    gPhoneApps[2] = TextDrawCreate(220.0, 180.0, "MSG");
    TextDrawLetterSize(gPhoneApps[2], 0.4, 1.5);
    TextDrawAlignment(gPhoneApps[2], 1);
    TextDrawColor(gPhoneApps[2], COLOR_WHITE);
    TextDrawSetShadow(gPhoneApps[2], 0);
    TextDrawSetOutline(gPhoneApps[2], 1);
    TextDrawBackgroundColor(gPhoneApps[2], 0xFFFF00AA);
    TextDrawFont(gPhoneApps[2], 2);
    TextDrawSetProportional(gPhoneApps[2], 1);
    TextDrawSetSelectable(gPhoneApps[2], 1);
    
    gPhoneApps[3] = TextDrawCreate(320.0, 180.0, "LIGAR");
    TextDrawLetterSize(gPhoneApps[3], 0.4, 1.5);
    TextDrawAlignment(gPhoneApps[3], 1);
    TextDrawColor(gPhoneApps[3], COLOR_WHITE);
    TextDrawSetShadow(gPhoneApps[3], 0);
    TextDrawSetOutline(gPhoneApps[3], 1);
    TextDrawBackgroundColor(gPhoneApps[3], 0x00FF00AA);
    TextDrawFont(gPhoneApps[3], 2);
    TextDrawSetProportional(gPhoneApps[3], 1);
    TextDrawSetSelectable(gPhoneApps[3], 1);
    
    gPhoneApps[4] = TextDrawCreate(220.0, 240.0, "EMPREGOS");
    TextDrawLetterSize(gPhoneApps[4], 0.4, 1.5);
    TextDrawAlignment(gPhoneApps[4], 1);
    TextDrawColor(gPhoneApps[4], COLOR_WHITE);
    TextDrawSetShadow(gPhoneApps[4], 0);
    TextDrawSetOutline(gPhoneApps[4], 1);
    TextDrawBackgroundColor(gPhoneApps[4], 0xFF8000AA);
    TextDrawFont(gPhoneApps[4], 2);
    TextDrawSetProportional(gPhoneApps[4], 1);
    TextDrawSetSelectable(gPhoneApps[4], 1);
    
    gPhoneApps[5] = TextDrawCreate(320.0, 240.0, "CASAS");
    TextDrawLetterSize(gPhoneApps[5], 0.4, 1.5);
    TextDrawAlignment(gPhoneApps[5], 1);
    TextDrawColor(gPhoneApps[5], COLOR_WHITE);
    TextDrawSetShadow(gPhoneApps[5], 0);
    TextDrawSetOutline(gPhoneApps[5], 1);
    TextDrawBackgroundColor(gPhoneApps[5], 0x8000FFAA);
    TextDrawFont(gPhoneApps[5], 2);
    TextDrawSetProportional(gPhoneApps[5], 1);
    TextDrawSetSelectable(gPhoneApps[5], 1);
    
    // Botão fechar
    gPhoneClose = TextDrawCreate(420.0, 100.0, "X");
    TextDrawLetterSize(gPhoneClose, 0.5, 2.0);
    TextDrawAlignment(gPhoneClose, 1);
    TextDrawColor(gPhoneClose, COLOR_RED);
    TextDrawSetShadow(gPhoneClose, 0);
    TextDrawSetOutline(gPhoneClose, 1);
    TextDrawBackgroundColor(gPhoneClose, 0x000000AA);
    TextDrawFont(gPhoneClose, 2);
    TextDrawSetProportional(gPhoneClose, 1);
    TextDrawSetSelectable(gPhoneClose, 1);
}

ShowPhone(playerid) {
    if(!PlayerData[playerid][pLogged] || !PlayerData[playerid][pSpawned]) return 0;
    
    TextDrawShowForPlayer(playerid, gPhoneBackground);
    TextDrawShowForPlayer(playerid, gPhoneClose);
    
    for(new i = 0; i < 6; i++) {
        TextDrawShowForPlayer(playerid, gPhoneApps[i]);
    }
    
    gPlayerPhoneOpen[playerid] = true;
    SelectTextDraw(playerid, COLOR_YELLOW);
    return 1;
}

HidePhone(playerid) {
    TextDrawHideForPlayer(playerid, gPhoneBackground);
    TextDrawHideForPlayer(playerid, gPhoneClose);
    
    for(new i = 0; i < 6; i++) {
        TextDrawHideForPlayer(playerid, gPhoneApps[i]);
    }
    
    gPlayerPhoneOpen[playerid] = false;
    CancelSelectTextDraw(playerid);
    return 1;
}

public OnPlayerClickTextDraw(playerid, Text:clickedid) {
    if(clickedid == gPhoneClose) {
        HidePhone(playerid);
        return 1;
    }
    
    if(clickedid == gPhoneApps[0]) { // BANCO
        ShowPlayerDialog(playerid, DIALOG_BANK, DIALOG_STYLE_LIST, "Banco", "Ver Saldo\nSacar\nDepositar\nTransferir", "Selecionar", "Cancelar");
        return 1;
    }
    
    if(clickedid == gPhoneApps[1]) { // PIX
        ShowPlayerDialog(playerid, DIALOG_PIX, DIALOG_STYLE_INPUT, "PIX", "Digite o valor para transferir:", "Enviar", "Cancelar");
        return 1;
    }
    
    if(clickedid == gPhoneApps[2]) { // MSG
        ShowPlayerDialog(playerid, DIALOG_MESSAGE, DIALOG_STYLE_INPUT, "Mensagem", "Digite sua mensagem:", "Enviar", "Cancelar");
        return 1;
    }
    
    if(clickedid == gPhoneApps[3]) { // LIGAR
        ShowPlayerDialog(playerid, DIALOG_CALL, DIALOG_STYLE_INPUT, "Ligar", "Digite o número:", "Ligar", "Cancelar");
        return 1;
    }
    
    if(clickedid == gPhoneApps[4]) { // EMPREGOS
        ShowPlayerDialog(playerid, DIALOG_JOBS, DIALOG_STYLE_LIST, "Empregos", "Policial\nMédico\nTaxista\nMecânico\nVendedor", "Selecionar", "Cancelar");
        return 1;
    }
    
    if(clickedid == gPhoneApps[5]) { // CASAS
        ShowPlayerDialog(playerid, DIALOG_HOUSES, DIALOG_STYLE_LIST, "Casas", "Minhas Casas\nComprar Casa\nVender Casa", "Selecionar", "Cancelar");
        return 1;
    }
    
    return 1;
}

// Comando para abrir celular
YCMD:celular(playerid, params[], help) {
    if(help) {
        SendClientMessage(playerid, COLOR_YELLOW, "Abre o celular.");
        return 1;
    }
    
    if(!PlayerData[playerid][pLogged] || !PlayerData[playerid][pSpawned]) {
        SendClientMessage(playerid, COLOR_RED, "Você precisa estar logado para usar o celular!");
        return 1;
    }
    
    if(gPlayerPhoneOpen[playerid]) {
        HidePhone(playerid);
        SendClientMessage(playerid, COLOR_GRAY, "Celular fechado.");
    } else {
        ShowPhone(playerid);
        SendClientMessage(playerid, COLOR_GRAY, "Celular aberto.");
    }
    
    return 1;
}