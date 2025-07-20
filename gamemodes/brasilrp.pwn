// ===========================================
// Brasil RP - Gamemode Roleplay Moderno
// Compatível com SA:MP 0.3.7 e SAMP Mobile
// ===========================================

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

// ===========================================
// DEFINES E CONFIGURAÇÕES
// ===========================================

#define SERVER_NAME "Brasil RP"
#define SERVER_PORT 7777
#define SAVE_FILE "players.ini"
#define MAX_PLAYERS 100
#define MAX_VEHICLES 200
#define MAX_HOUSES 50
#define MAX_JOBS 10

// Cores
#define COLOR_WHITE 0xFFFFFFFF
#define COLOR_RED 0xFF0000FF
#define COLOR_GREEN 0x00FF00FF
#define COLOR_BLUE 0x0000FFFF
#define COLOR_YELLOW 0xFFFF00FF
#define COLOR_ORANGE 0xFF8000FF
#define COLOR_PURPLE 0x8000FFFF
#define COLOR_GRAY 0x808080FF
#define COLOR_BLACK 0x000000FF

// ===========================================
// ENUMS E STRUCTS
// ===========================================

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

enum E_VEHICLE_DATA {
    vID,
    vModel,
    vOwner[MAX_PLAYER_NAME],
    vPlate[10],
    vColor1,
    vColor2,
    Float:vX,
    Float:vY,
    Float:vZ,
    Float:vAngle,
    vInterior,
    vVirtualWorld,
    bool:vLocked,
    bool:vExists
}

enum E_HOUSE_DATA {
    hID,
    hOwner[MAX_PLAYER_NAME],
    Float:hX,
    Float:hY,
    Float:hZ,
    hInterior,
    hVirtualWorld,
    hPrice,
    bool:hLocked,
    bool:hExists
}

// ===========================================
// VARIÁVEIS GLOBAIS
// ===========================================

new PlayerData[MAX_PLAYERS][E_PLAYER_DATA];
new VehicleData[MAX_VEHICLES][E_VEHICLE_DATA];
new HouseData[MAX_HOUSES][E_HOUSE_DATA];

// TextDraws
new Text:gLoginBackground;
new Text:gLoginTitle;
new Text:gLoginUsername;
new Text:gLoginPassword;
new Text:gLoginButton;
new Text:gRegisterButton;
new Text:gHUDMoney;
new Text:gHUDHunger;
new Text:gHUDThirst;
new Text:gPhoneBackground;
new Text:gPhoneApps[10];

// Player TextDraws
new PlayerText:gPlayerLoginBox[MAX_PLAYERS];
new PlayerText:gPlayerLoginInput[MAX_PLAYERS];
new PlayerText:gPlayerPhone[MAX_PLAYERS];

// ===========================================
// FORWARDS
// ===========================================

forward OnPlayerDataLoad(playerid);
forward OnPlayerDataSave(playerid);
forward OnVehicleDataLoad();
forward OnHouseDataLoad();
forward UpdateHUD(playerid);
forward UpdateHungerThirst(playerid);

// ===========================================
// MAIN
// ===========================================

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
    
    // Carregar dados
    LoadVehicleData();
    LoadHouseData();
    
    // Criar TextDraws
    CreateLoginTextDraws();
    CreateHUDTextDraws();
    CreatePhoneTextDraws();
    
    print("Brasil RP carregado com sucesso!");
    return 1;
}

public OnGameModeExit() {
    // Salvar dados de todos os jogadores
    foreach(new i : Player) {
        if(PlayerData[i][pLogged]) {
            SavePlayerData(i);
        }
    }
    return 1;
}