#include <a_samp>
#include <sscanf2>
#include <YSI_Data\y_iterate>
#include <YSI_Core\y_utils>
#include <YSI_Visual\y_commands>
#include <YSI_Data\y_player>
#include <YSI_Data\y_bit>
#include <YSI_Data\y_hooks>
#include <YSI_Data\y_timers>
#include <YSI_Data\y_foreach>
#include <YSI_Data\y_ini>
#include <YSI_Data\y_json>

#define SERVER_NAME "Brasil RP"
#define SERVER_PORT 7777
#define SAVE_FILE "players.ini"
#define MAX_PLAYERS 100
#define MAX_VEHICLES 200
#define MAX_HOUSES 50
#define MAX_JOBS 10

#define COLOR_WHITE 0xFFFFFFFF
#define COLOR_RED 0xFF0000FF
#define COLOR_GREEN 0x00FF00FF
#define COLOR_BLUE 0x0000FFFF
#define COLOR_YELLOW 0xFFFF00FF
#define COLOR_ORANGE 0xFF8000FF
#define COLOR_PURPLE 0x8000FFFF
#define COLOR_GRAY 0x808080FF
#define COLOR_BLACK 0x000000FF

// Dialog IDs
#define DIALOG_LOGIN 1
#define DIALOG_REGISTER 2
#define DIALOG_INFO 3
#define DIALOG_JOB_APPLY 4
#define DIALOG_BANK 5
#define DIALOG_BANK_WITHDRAW 6
#define DIALOG_BANK_DEPOSIT 7
#define DIALOG_PIX 8
#define DIALOG_PIX_TARGET 9
#define DIALOG_MESSAGE 10
#define DIALOG_CALL 11
#define DIALOG_JOBS 12
#define DIALOG_HOUSES 13

enum E_PLAYER_DATA {
    pID,
    pName[MAX_PLAYER_NAME],
    pPassword[65],
    pMoney,
    pBank,
    pLevel,
    pExp,
    pJob,
    pJobLevel,
    pHunger,
    pThirst,
    pHealth,
    pArmor,
    pSpawnX,
    pSpawnY,
    pSpawnZ,
    pSpawnAngle,
    pInterior,
    pVirtualWorld,
    pPhone,
    pPhoneNumber[15],
    pHouseID,
    pVehicleID,
    pJailTime,
    pFine,
    pAdminLevel,
    bool:pLogged,
    bool:pSpawned,
    bool:pInVehicle,
    bool:pOnPhone
}

new PlayerData[MAX_PLAYERS][E_PLAYER_DATA];

// Variáveis globais dos sistemas
new Text:gLoginBackground;
new Text:gLoginTitle;
new Text:gLoginButton;
new Text:gRegisterButton;
new Text:gHUDMoney;
new Text:gHUDHunger;
new Text:gHUDThirst;
new Text:gPhoneBackground;
new Text:gPhoneApps[10];
new Text:gPhoneClose;
new bool:gPlayerPhoneOpen[MAX_PLAYERS];

// Sistema de empregos
new gJobNPCs[MAX_JOBS];
new gJobPickups[MAX_JOBS];
new gJobLabels[MAX_JOBS];
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

// Sistema anti-cheat
new Float:gPlayerLastPos[MAX_PLAYERS][3];
new gPlayerLastHealth[MAX_PLAYERS];
new gPlayerLastArmor[MAX_PLAYERS];
new gPlayerSpeedWarnings[MAX_PLAYERS];
new gPlayerTeleportWarnings[MAX_PLAYERS];
new gPlayerGodModeWarnings[MAX_PLAYERS];
new Text:gLoginTitle;
new Text:gLoginButton;
new Text:gRegisterButton;
new Text:gHUDMoney;
new Text:gHUDHunger;
new Text:gHUDThirst;

main() {
    print("===========================================");
    print("Brasil RP - Gamemode Roleplay Moderno");
    print("Carregando...");
    print("===========================================");
}

public OnGameModeInit() {
    SetGameModeText("Brasil RP v1.0");
    ShowPlayerMarkers(PLAYER_MARKERS_MODE_GLOBAL);
    ShowNameTags(1);
    SetNameTagDrawDistance(20.0);
    EnableStuntBonusForAll(0);
    DisableInteriorEnterExits();
    
    CreateTextDraws();
    CreatePhoneTextDraws();
    CreateJobSystem();
    
    // Iniciar timers
    SetTimer("UpdateJailTime", 60000, true);
    
    print("Brasil RP carregado com sucesso!");
    return 1;
}

public OnGameModeExit() {
    foreach(new i : Player) {
        if(PlayerData[i][pLogged]) {
            SavePlayerData(i);
        }
    }
    return 1;
}

CreateTextDraws() {
    gLoginBackground = TextDrawCreate(0.0, 0.0, "LD_SPAC:white");
    TextDrawLetterSize(gLoginBackground, 0.0, 0.0);
    TextDrawTextSize(gLoginBackground, 640.0, 448.0);
    TextDrawAlignment(gLoginBackground, 0);
    TextDrawColor(gLoginBackground, 0x000000AA);
    TextDrawSetShadow(gLoginBackground, 0);
    TextDrawSetOutline(gLoginBackground, 0);
    TextDrawBackgroundColor(gLoginBackground, 0x000000FF);
    TextDrawFont(gLoginBackground, 4);
    TextDrawSetProportional(gLoginBackground, 0);
    TextDrawSetSelectable(gLoginBackground, 0);
    
    gLoginTitle = TextDrawCreate(320.0, 100.0, "BRASIL RP");
    TextDrawLetterSize(gLoginTitle, 1.2, 3.0);
    TextDrawAlignment(gLoginTitle, 2);
    TextDrawColor(gLoginTitle, COLOR_WHITE);
    TextDrawSetShadow(gLoginTitle, 0);
    TextDrawSetOutline(gLoginTitle, 2);
    TextDrawBackgroundColor(gLoginTitle, 0x000000FF);
    TextDrawFont(gLoginTitle, 3);
    TextDrawSetProportional(gLoginTitle, 1);
    TextDrawSetSelectable(gLoginTitle, 0);
    
    gLoginButton = TextDrawCreate(320.0, 320.0, "ENTRAR");
    TextDrawLetterSize(gLoginButton, 0.5, 2.0);
    TextDrawAlignment(gLoginButton, 2);
    TextDrawColor(gLoginButton, COLOR_WHITE);
    TextDrawSetShadow(gLoginButton, 0);
    TextDrawSetOutline(gLoginButton, 1);
    TextDrawBackgroundColor(gLoginButton, 0x00FF00AA);
    TextDrawFont(gLoginButton, 2);
    TextDrawSetProportional(gLoginButton, 1);
    TextDrawSetSelectable(gLoginButton, 1);
    
    gRegisterButton = TextDrawCreate(320.0, 360.0, "REGISTRAR");
    TextDrawLetterSize(gRegisterButton, 0.5, 2.0);
    TextDrawAlignment(gRegisterButton, 2);
    TextDrawColor(gRegisterButton, COLOR_WHITE);
    TextDrawSetShadow(gRegisterButton, 0);
    TextDrawSetOutline(gRegisterButton, 1);
    TextDrawBackgroundColor(gRegisterButton, 0x0080FFAA);
    TextDrawFont(gRegisterButton, 2);
    TextDrawSetProportional(gRegisterButton, 1);
    TextDrawSetSelectable(gRegisterButton, 1);
    
    gHUDMoney = TextDrawCreate(500.0, 20.0, "$0");
    TextDrawLetterSize(gHUDMoney, 0.4, 1.2);
    TextDrawAlignment(gHUDMoney, 3);
    TextDrawColor(gHUDMoney, COLOR_GREEN);
    TextDrawSetShadow(gHUDMoney, 1);
    TextDrawSetOutline(gHUDMoney, 1);
    TextDrawBackgroundColor(gHUDMoney, 0x000000AA);
    TextDrawFont(gHUDMoney, 3);
    TextDrawSetProportional(gHUDMoney, 1);
    TextDrawSetSelectable(gHUDMoney, 0);
    
    gHUDHunger = TextDrawCreate(500.0, 40.0, "FOME: 100%");
    TextDrawLetterSize(gHUDHunger, 0.3, 1.0);
    TextDrawAlignment(gHUDHunger, 3);
    TextDrawColor(gHUDHunger, COLOR_ORANGE);
    TextDrawSetShadow(gHUDHunger, 1);
    TextDrawSetOutline(gHUDHunger, 1);
    TextDrawBackgroundColor(gHUDHunger, 0x000000AA);
    TextDrawFont(gHUDHunger, 2);
    TextDrawSetProportional(gHUDHunger, 1);
    TextDrawSetSelectable(gHUDHunger, 0);
    
    gHUDThirst = TextDrawCreate(500.0, 55.0, "SEDE: 100%");
    TextDrawLetterSize(gHUDThirst, 0.3, 1.0);
    TextDrawAlignment(gHUDThirst, 3);
    TextDrawColor(gHUDThirst, COLOR_BLUE);
    TextDrawSetShadow(gHUDThirst, 1);
    TextDrawSetOutline(gHUDThirst, 1);
    TextDrawBackgroundColor(gHUDThirst, 0x000000AA);
    TextDrawFont(gHUDThirst, 2);
    TextDrawSetProportional(gHUDThirst, 1);
    TextDrawSetSelectable(gHUDThirst, 0);
}

public OnPlayerConnect(playerid) {
    GetPlayerName(playerid, PlayerData[playerid][pName], MAX_PLAYER_NAME);
    PlayerData[playerid][pLogged] = false;
    PlayerData[playerid][pSpawned] = false;
    
    ShowLoginScreen(playerid);
    return 1;
}

public OnPlayerDisconnect(playerid, reason) {
    if(PlayerData[playerid][pLogged]) {
        SavePlayerData(playerid);
    }
    return 1;
}

ShowLoginScreen(playerid) {
    TextDrawShowForPlayer(playerid, gLoginBackground);
    TextDrawShowForPlayer(playerid, gLoginTitle);
    TextDrawShowForPlayer(playerid, gLoginButton);
    TextDrawShowForPlayer(playerid, gRegisterButton);
    SelectTextDraw(playerid, COLOR_YELLOW);
    TogglePlayerSpectating(playerid, 1);
}

HideLoginScreen(playerid) {
    TextDrawHideForPlayer(playerid, gLoginBackground);
    TextDrawHideForPlayer(playerid, gLoginTitle);
    TextDrawHideForPlayer(playerid, gLoginButton);
    TextDrawHideForPlayer(playerid, gRegisterButton);
    CancelSelectTextDraw(playerid);
    TogglePlayerSpectating(playerid, 0);
}

ShowHUD(playerid) {
    if(!PlayerData[playerid][pLogged]) return 0;
    
    TextDrawShowForPlayer(playerid, gHUDMoney);
    TextDrawShowForPlayer(playerid, gHUDHunger);
    TextDrawShowForPlayer(playerid, gHUDThirst);
    
    UpdateHUD(playerid);
    return 1;
}

HideHUD(playerid) {
    TextDrawHideForPlayer(playerid, gHUDMoney);
    TextDrawHideForPlayer(playerid, gHUDHunger);
    TextDrawHideForPlayer(playerid, gHUDThirst);
    return 1;
}

public OnPlayerClickTextDraw(playerid, Text:clickedid) {
    if(clickedid == gLoginButton) {
        ShowPlayerDialog(playerid, DIALOG_LOGIN, DIALOG_STYLE_PASSWORD, "Login", "Digite sua senha:", "Entrar", "Cancelar");
    }
    else if(clickedid == gRegisterButton) {
        ShowPlayerDialog(playerid, DIALOG_REGISTER, DIALOG_STYLE_PASSWORD, "Registro", "Digite uma senha:", "Registrar", "Cancelar");
    }
    return 1;
}

public OnPlayerSpawn(playerid) {
    if(!PlayerData[playerid][pLogged]) return 0;
    
    SetSpawnInfo(playerid, 0, 0, PlayerData[playerid][pSpawnX], PlayerData[playerid][pSpawnY], PlayerData[playerid][pSpawnZ], PlayerData[playerid][pSpawnAngle], 0, 0, 0, 0, 0, 0);
    SetPlayerHealth(playerid, PlayerData[playerid][pHealth]);
    SetPlayerArmour(playerid, PlayerData[playerid][pArmor]);
    
    PlayerData[playerid][pSpawned] = true;
    ShowHUD(playerid);
    
    SetTimerEx("UpdateHungerThirst", 60000, true, "i", playerid);
    return 1;
}

public OnPlayerDeath(playerid, killerid, reason) {
    PlayerData[playerid][pHealth] = 100.0;
    PlayerData[playerid][pArmor] = 0.0;
    return 1;
}

public OnDialogResponse(playerid, dialogid, response, listitem, inputtext[]) {
    switch(dialogid) {
        case DIALOG_LOGIN: {
            if(!response) return 1;
            
            if(strlen(inputtext) < 1) {
                ShowPlayerDialog(playerid, DIALOG_LOGIN, DIALOG_STYLE_PASSWORD, "Login", "Digite sua senha:", "Entrar", "Cancelar");
                return 1;
            }
            
            if(LoadPlayerData(playerid)) {
                if(strcmp(PlayerData[playerid][pPassword], inputtext, false) == 0) {
                    PlayerData[playerid][pLogged] = true;
                    HideLoginScreen(playerid);
                    SpawnPlayer(playerid);
                    SendClientMessage(playerid, COLOR_GREEN, "Login realizado com sucesso!");
                } else {
                    ShowPlayerDialog(playerid, DIALOG_LOGIN, DIALOG_STYLE_PASSWORD, "Login", "Senha incorreta!\nDigite sua senha:", "Entrar", "Cancelar");
                }
            } else {
                ShowPlayerDialog(playerid, DIALOG_REGISTER, DIALOG_STYLE_PASSWORD, "Registro", "Conta não encontrada!\nDigite uma senha para registrar:", "Registrar", "Cancelar");
            }
        }
        case DIALOG_REGISTER: {
            if(!response) return 1;
            
            if(strlen(inputtext) < 4) {
                ShowPlayerDialog(playerid, DIALOG_REGISTER, DIALOG_STYLE_PASSWORD, "Registro", "Senha muito curta!\nDigite uma senha (min. 4 caracteres):", "Registrar", "Cancelar");
                return 1;
            }
            
            strcpy(PlayerData[playerid][pPassword], inputtext, 65);
            PlayerData[playerid][pMoney] = 1000;
            PlayerData[playerid][pBank] = 5000;
            PlayerData[playerid][pLevel] = 1;
            PlayerData[playerid][pExp] = 0;
            PlayerData[playerid][pJob] = 0;
            PlayerData[playerid][pJobLevel] = 1;
            PlayerData[playerid][pHunger] = 100;
            PlayerData[playerid][pThirst] = 100;
            PlayerData[playerid][pHealth] = 100.0;
            PlayerData[playerid][pArmor] = 0.0;
            PlayerData[playerid][pSpawnX] = 1958.3783;
            PlayerData[playerid][pSpawnY] = -1714.2943;
            PlayerData[playerid][pSpawnZ] = 13.6406;
            PlayerData[playerid][pSpawnAngle] = 0.0;
            PlayerData[playerid][pInterior] = 0;
            PlayerData[playerid][pVirtualWorld] = 0;
            PlayerData[playerid][pPhone] = 1;
            format(PlayerData[playerid][pPhoneNumber], 15, "%d", random(900000000) + 100000000);
            PlayerData[playerid][pHouseID] = -1;
            PlayerData[playerid][pVehicleID] = -1;
            PlayerData[playerid][pJailTime] = 0;
            PlayerData[playerid][pFine] = 0;
            PlayerData[playerid][pAdminLevel] = 0;
            
            SavePlayerData(playerid);
            PlayerData[playerid][pLogged] = true;
            HideLoginScreen(playerid);
            SpawnPlayer(playerid);
            SendClientMessage(playerid, COLOR_GREEN, "Conta registrada com sucesso!");
        }
    }
    return 1;
}

SavePlayerData(playerid) {
    if(!PlayerData[playerid][pLogged]) return 0;
    
    new filename[64];
    format(filename, sizeof(filename), "players/%s.ini", PlayerData[playerid][pName]);
    
    new INI:file = INI_Open(filename);
    if(file == INI_NO_FILE) return 0;
    
    INI_SetTag(file, "player_data");
    INI_WriteString(file, "password", PlayerData[playerid][pPassword]);
    INI_WriteInt(file, "money", PlayerData[playerid][pMoney]);
    INI_WriteInt(file, "bank", PlayerData[playerid][pBank]);
    INI_WriteInt(file, "level", PlayerData[playerid][pLevel]);
    INI_WriteInt(file, "exp", PlayerData[playerid][pExp]);
    INI_WriteInt(file, "job", PlayerData[playerid][pJob]);
    INI_WriteInt(file, "job_level", PlayerData[playerid][pJobLevel]);
    INI_WriteInt(file, "hunger", PlayerData[playerid][pHunger]);
    INI_WriteInt(file, "thirst", PlayerData[playerid][pThirst]);
    INI_WriteFloat(file, "spawn_x", PlayerData[playerid][pSpawnX]);
    INI_WriteFloat(file, "spawn_y", PlayerData[playerid][pSpawnY]);
    INI_WriteFloat(file, "spawn_z", PlayerData[playerid][pSpawnZ]);
    INI_WriteFloat(file, "spawn_angle", PlayerData[playerid][pSpawnAngle]);
    INI_WriteInt(file, "interior", PlayerData[playerid][pInterior]);
    INI_WriteInt(file, "virtual_world", PlayerData[playerid][pVirtualWorld]);
    INI_WriteInt(file, "phone", PlayerData[playerid][pPhone]);
    INI_WriteString(file, "phone_number", PlayerData[playerid][pPhoneNumber]);
    INI_WriteInt(file, "house_id", PlayerData[playerid][pHouseID]);
    INI_WriteInt(file, "vehicle_id", PlayerData[playerid][pVehicleID]);
    INI_WriteInt(file, "jail_time", PlayerData[playerid][pJailTime]);
    INI_WriteInt(file, "fine", PlayerData[playerid][pFine]);
    INI_WriteInt(file, "admin_level", PlayerData[playerid][pAdminLevel]);
    
    INI_Close(file);
    return 1;
}

LoadPlayerData(playerid) {
    new filename[64];
    format(filename, sizeof(filename), "players/%s.ini", PlayerData[playerid][pName]);
    
    new INI:file = INI_Open(filename);
    if(file == INI_NO_FILE) return 0;
    
    INI_SetTag(file, "player_data");
    INI_ReadString(file, "password", PlayerData[playerid][pPassword], 65, "");
    INI_ReadInt(file, "money", PlayerData[playerid][pMoney]);
    INI_ReadInt(file, "bank", PlayerData[playerid][pBank]);
    INI_ReadInt(file, "level", PlayerData[playerid][pLevel]);
    INI_ReadInt(file, "exp", PlayerData[playerid][pExp]);
    INI_ReadInt(file, "job", PlayerData[playerid][pJob]);
    INI_ReadInt(file, "job_level", PlayerData[playerid][pJobLevel]);
    INI_ReadInt(file, "hunger", PlayerData[playerid][pHunger]);
    INI_ReadInt(file, "thirst", PlayerData[playerid][pThirst]);
    INI_ReadFloat(file, "spawn_x", PlayerData[playerid][pSpawnX]);
    INI_ReadFloat(file, "spawn_y", PlayerData[playerid][pSpawnY]);
    INI_ReadFloat(file, "spawn_z", PlayerData[playerid][pSpawnZ]);
    INI_ReadFloat(file, "spawn_angle", PlayerData[playerid][pSpawnAngle]);
    INI_ReadInt(file, "interior", PlayerData[playerid][pInterior]);
    INI_ReadInt(file, "virtual_world", PlayerData[playerid][pVirtualWorld]);
    INI_ReadInt(file, "phone", PlayerData[playerid][pPhone]);
    INI_ReadString(file, "phone_number", PlayerData[playerid][pPhoneNumber], 15, "");
    INI_ReadInt(file, "house_id", PlayerData[playerid][pHouseID]);
    INI_ReadInt(file, "vehicle_id", PlayerData[playerid][pVehicleID]);
    INI_ReadInt(file, "jail_time", PlayerData[playerid][pJailTime]);
    INI_ReadInt(file, "fine", PlayerData[playerid][pFine]);
    INI_ReadInt(file, "admin_level", PlayerData[playerid][pAdminLevel]);
    
    INI_Close(file);
    return 1;
}

UpdateHUD(playerid) {
    if(!PlayerData[playerid][pLogged] || !PlayerData[playerid][pSpawned]) return 0;
    
    new money_str[32], hunger_str[32], thirst_str[32];
    format(money_str, sizeof(money_str), "$%d", PlayerData[playerid][pMoney]);
    format(hunger_str, sizeof(hunger_str), "FOME: %d%%", PlayerData[playerid][pHunger]);
    format(thirst_str, sizeof(thirst_str), "SEDE: %d%%", PlayerData[playerid][pThirst]);
    
    TextDrawSetString(gHUDMoney, money_str);
    TextDrawSetString(gHUDHunger, hunger_str);
    TextDrawSetString(gHUDThirst, thirst_str);
    return 1;
}

public UpdateHungerThirst(playerid) {
    if(!PlayerData[playerid][pLogged] || !PlayerData[playerid][pSpawned]) return 0;
    
    PlayerData[playerid][pHunger] -= 2;
    PlayerData[playerid][pThirst] -= 3;
    
    if(PlayerData[playerid][pHunger] < 0) PlayerData[playerid][pHunger] = 0;
    if(PlayerData[playerid][pThirst] < 0) PlayerData[playerid][pThirst] = 0;
    
    if(PlayerData[playerid][pHunger] <= 10 || PlayerData[playerid][pThirst] <= 10) {
        SetPlayerHealth(playerid, GetPlayerHealth(playerid) - 5.0);
        SendClientMessage(playerid, COLOR_RED, "Você está com fome/sede! Procure comida e água!");
    }
    
    UpdateHUD(playerid);
    return 1;
}

// Comandos básicos
YCMD:comandos(playerid, params[], help) {
    if(help) {
        SendClientMessage(playerid, COLOR_YELLOW, "Mostra todos os comandos disponíveis.");
        return 1;
    }
    
    SendClientMessage(playerid, COLOR_WHITE, "=== COMANDOS DISPONÍVEIS ===");
    SendClientMessage(playerid, COLOR_GRAY, "/comandos - Mostra esta lista");
    SendClientMessage(playerid, COLOR_GRAY, "/dinheiro - Mostra seu dinheiro");
    SendClientMessage(playerid, COLOR_GRAY, "/banco - Acessa o banco");
    SendClientMessage(playerid, COLOR_GRAY, "/celular - Abre o celular");
    SendClientMessage(playerid, COLOR_GRAY, "/empregos - Lista empregos disponíveis");
    SendClientMessage(playerid, COLOR_GRAY, "/comer - Come algo (se tiver comida)");
    SendClientMessage(playerid, COLOR_GRAY, "/beber - Bebe algo (se tiver bebida)");
    SendClientMessage(playerid, COLOR_GRAY, "/identidade - Mostra sua identidade");
    return 1;
}

YCMD:dinheiro(playerid, params[], help) {
    if(help) {
        SendClientMessage(playerid, COLOR_YELLOW, "Mostra seu dinheiro em mãos e no banco.");
        return 1;
    }
    
    new string[128];
    format(string, sizeof(string), "Dinheiro: $%d | Banco: $%d", PlayerData[playerid][pMoney], PlayerData[playerid][pBank]);
    SendClientMessage(playerid, COLOR_GREEN, string);
    return 1;
}

YCMD:comer(playerid, params[], help) {
    if(help) {
        SendClientMessage(playerid, COLOR_YELLOW, "Come algo para recuperar fome.");
        return 1;
    }
    
    PlayerData[playerid][pHunger] += 30;
    if(PlayerData[playerid][pHunger] > 100) PlayerData[playerid][pHunger] = 100;
    
    SendClientMessage(playerid, COLOR_GREEN, "Você comeu algo e recuperou fome!");
    UpdateHUD(playerid);
    return 1;
}

YCMD:beber(playerid, params[], help) {
    if(help) {
        SendClientMessage(playerid, COLOR_YELLOW, "Bebe algo para recuperar sede.");
        return 1;
    }
    
    PlayerData[playerid][pThirst] += 30;
    if(PlayerData[playerid][pThirst] > 100) PlayerData[playerid][pThirst] = 100;
    
    SendClientMessage(playerid, COLOR_GREEN, "Você bebeu algo e recuperou sede!");
    UpdateHUD(playerid);
    return 1;
}

YCMD:identidade(playerid, params[], help) {
    if(help) {
        SendClientMessage(playerid, COLOR_YELLOW, "Mostra sua identidade.");
        return 1;
    }
    
    new string[256];
    format(string, sizeof(string), "=== IDENTIDADE ===\nNome: %s\nTelefone: %s\nEmprego: %d\nNível: %d\nDinheiro: $%d", 
        PlayerData[playerid][pName], 
        PlayerData[playerid][pPhoneNumber], 
        PlayerData[playerid][pJob], 
        PlayerData[playerid][pLevel], 
        PlayerData[playerid][pMoney]
    );
    ShowPlayerDialog(playerid, DIALOG_INFO, DIALOG_STYLE_MSGBOX, "Identidade", string, "OK", "");
    return 1;
}

// Adicionar dialogs do celular e banco
public OnDialogResponse(playerid, dialogid, response, listitem, inputtext[]) {
    switch(dialogid) {
        case DIALOG_JOB_APPLY: {
            if(!response) return 1;
            
            new jobid = listitem + 1;
            PlayerData[playerid][pJob] = jobid;
            PlayerData[playerid][pJobLevel] = 1;
            
            new string[128];
            format(string, sizeof(string), "Parabéns! Você foi contratado como %s!", gJobNames[jobid-1]);
            SendClientMessage(playerid, COLOR_GREEN, string);
        }
        case DIALOG_BANK: {
            if(!response) return 1;
            
            switch(listitem) {
                case 0: { // Ver Saldo
                    new string[128];
                    format(string, sizeof(string), "Saldo em conta: $%d", PlayerData[playerid][pBank]);
                    SendClientMessage(playerid, COLOR_GREEN, string);
                }
                case 1: { // Sacar
                    ShowPlayerDialog(playerid, DIALOG_BANK_WITHDRAW, DIALOG_STYLE_INPUT, "Sacar", "Digite o valor para sacar:", "Sacar", "Cancelar");
                }
                case 2: { // Depositar
                    ShowPlayerDialog(playerid, DIALOG_BANK_DEPOSIT, DIALOG_STYLE_INPUT, "Depositar", "Digite o valor para depositar:", "Depositar", "Cancelar");
                }
            }
        }
        case DIALOG_BANK_WITHDRAW: {
            if(!response) return 1;
            
            new amount = strval(inputtext);
            if(amount <= 0 || amount > PlayerData[playerid][pBank]) {
                SendClientMessage(playerid, COLOR_RED, "Valor inválido!");
                return 1;
            }
            
            PlayerData[playerid][pBank] -= amount;
            PlayerData[playerid][pMoney] += amount;
            
            new string[128];
            format(string, sizeof(string), "Você sacou $%d da sua conta!", amount);
            SendClientMessage(playerid, COLOR_GREEN, string);
            UpdateHUD(playerid);
        }
        case DIALOG_BANK_DEPOSIT: {
            if(!response) return 1;
            
            new amount = strval(inputtext);
            if(amount <= 0 || amount > PlayerData[playerid][pMoney]) {
                SendClientMessage(playerid, COLOR_RED, "Valor inválido!");
                return 1;
            }
            
            PlayerData[playerid][pMoney] -= amount;
            PlayerData[playerid][pBank] += amount;
            
            new string[128];
            format(string, sizeof(string), "Você depositou $%d na sua conta!", amount);
            SendClientMessage(playerid, COLOR_GREEN, string);
            UpdateHUD(playerid);
        }
        case DIALOG_PIX: {
            if(!response) return 1;
            
            new amount = strval(inputtext);
            if(amount <= 0 || amount > PlayerData[playerid][pMoney]) {
                SendClientMessage(playerid, COLOR_RED, "Valor inválido!");
                return 1;
            }
            
            ShowPlayerDialog(playerid, DIALOG_PIX_TARGET, DIALOG_STYLE_INPUT, "PIX", "Digite o nome do destinatário:", "Enviar", "Cancelar");
        }
        case DIALOG_MESSAGE: {
            if(!response) return 1;
            
            if(strlen(inputtext) < 1) {
                SendClientMessage(playerid, COLOR_RED, "Mensagem muito curta!");
                return 1;
            }
            
            new string[256];
            format(string, sizeof(string), "[SMS] %s: %s", PlayerData[playerid][pName], inputtext);
            SendClientMessageToAll(COLOR_YELLOW, string);
        }
        case DIALOG_CALL: {
            if(!response) return 1;
            
            new number[15];
            strcpy(number, inputtext, 15);
            
            new string[128];
            format(string, sizeof(string), "Ligando para %s...", number);
            SendClientMessage(playerid, COLOR_GREEN, string);
        }
    }
    return 1;
}