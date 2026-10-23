// Boss definitions and palettes. Pure data; no DOM/canvas dependencies.
var BOSSES=[
 {key:'b1_',name:'VOID SOVEREIGN',hp:1500,w:235,h:200,style:'octopus',move:'sine',patterns:[0,1],aim:3,ring:0,aimRate:1.8,ringRate:5.0,laserRate:7.5,laserN:1,ultRate:12.0,glow:['255,70,90','255,85,170','255,190,100']},
 {key:'b2_',name:'ABYSS DEVOURER',hp:1900,w:245,h:210,style:'dread',move:'wide',patterns:[1,0],aim:5,ring:16,aimRate:1.7,ringRate:5.4,laserRate:6.5,laserN:2,ultRate:11.0,glow:['150,105,255','190,90,255','255,120,235']},
 {key:'b3_',name:'STAR BEHEMOTH',hp:2300,w:245,h:210,style:'hive',move:'dash',patterns:[0,1],aim:7,ring:20,aimRate:1.9,ringRate:4.6,laserRate:5.5,laserN:3,ultRate:10.0,glow:['255,160,70','255,120,60','255,215,120']},
 {key:'b4_',name:'SERAPHIC WINGS',hp:3200,w:300,h:250,style:'seraph',move:'wide',patterns:[1,0],aim:7,ring:18,aimRate:1.6,ringRate:4.7,laserRate:6.8,laserN:3,ultRate:9.8,glow:['255,235,170','255,248,225','255,215,120']},
 {key:'b5_',name:'CHRONOS ECHO',hp:4800,w:340,h:285,style:'chronos',move:'wide',patterns:[0,1],aim:9,ring:24,aimRate:1.35,ringRate:4.0,laserRate:5.8,laserN:4,ultRate:10.2,glow:['255,70,90','190,110,255','255,225,150']}
];
var BOSS_PALETTES=[
 {main:'#ff3d63',light:'#ff9ab0',core:'#fff4f7',dark:'#3a0712',edge:'#8fe8ff',glow:'rgba(255,50,95,0.55)',beam:'#ff5f7a'},
 {main:'#a85cff',light:'#e0b4ff',core:'#fff4ff',dark:'#1e0838',edge:'#ff9ae6',glow:'rgba(168,80,255,0.55)',beam:'#c06aff'},
 {main:'#ff9a2e',light:'#ffd27a',core:'#fff8e0',dark:'#3a1604',edge:'#7fe7ff',glow:'rgba(255,150,40,0.50)',beam:'#7fe7ff'},
 {main:'#ffe6a0',light:'#fffdf0',core:'#ffffff',dark:'#5a3d12',edge:'#fffdf0',glow:'rgba(255,220,120,0.50)',beam:'#ffe7a0'},
 {main:'#c7a6ff',light:'#fff4d0',core:'#ffffff',dark:'#160a2a',edge:'#7ff4ff',glow:'rgba(190,140,255,0.55)',beam:'#e8c8ff'},
 {main:'#fff4d6',light:'#ffffff',core:'#ffffff',dark:'#3a2a12',edge:'#ffd27a',glow:'rgba(255,240,190,0.60)',beam:'#fff2c0'}
];
