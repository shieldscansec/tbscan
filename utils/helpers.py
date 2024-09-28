"""
Módulo de funções utilitárias para o tbscan.
"""

import os

def check_root():
    """
    Verifica se o script está sendo executado como root.

    :return: True se for root, False caso contrário
    """
    return os.geteuid() == 0

def show_banner():
    """
    Exibe o banner da ferramenta.
    """
    banner = """
        ,----,                                                              
      ,/   .`|                                                         ,--. 
    ,`   .'  :   ,---,.   .--.--.     ,----..     ,---,              ,--.'| 
  ;    ;     / ,'  .'  \ /  /    '.  /   /   \   '  .' \         ,--,:  : | 
.'___,/    ,',---.' .' ||  :  /`. / |   :     : /  ;    '.    ,`--.'`|  ' : 
|    :     | |   |  |: |;  |  |--`  .   |  ;. /:  :       \   |   :  :  | | 
;    |.';  ; :   :  :  /|  :  ;_    .   ; /--` :  |   /\   \  :   |   \ | : 
`----'  |  | :   |    ;  \  \    `. ;   | ;    |  :  ' ;.   : |   : '  '; | 
    '   :  ; |   :     \  `----.   \|   : |    |  |  ;/  \   '   ' ;.    ; 
    |   |  ' |   |   . |  __ \  \  |.   | '___ '  :  | \  \ ,'|   | | \   | 
    '   :  | '   :  '; | /  /`--'  /'   ; : .'||  |  '  '--'  '   : |  ; .' 
    ;   |.'  |   |  | ; '--'.     / '   | '/  :|  :  :        |   | '`--'   
    '---'    |   :   /    `--'---'  |   :    / |  | ,'        '   : |       
             |   | ,'                \   \ .'  `--''          ;   |.'       
             `----'                   `---`                   '---'
    """
    print(banner)
