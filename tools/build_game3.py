import base64,os,re
s=open('bossrush.html',encoding='utf-8').read()
prefix=s[:s.index('var specs=null;')]
prefix=re.sub(r"BGMENU\.src='data:image/[^']+'", "BGMENU.src='assets/bg/menu.webp'", prefix, count=1)
assets={
 'p2':'player-v2/p2_center.png','p3':'player-v2/p3_right.png','p4':'player-v2/p4_left.png',
 'u1':'assets/bullets/u1n.png','u2':'assets/bullets/u2n.png','u4':'assets/bullets/u4n.png','u5':'assets/bullets/u5n.png','w1':'gpt-assets/player/wing-drone.png','q1':'gpt-assets/bosses/boss_1_phase3_ring.png','q2':'gpt-assets/bosses/boss_2_phase3_ring.png','q3':'gpt-assets/bosses/boss_3_phase3_ring.png','q4':'gpt-assets/bosses/boss_4_phase3_ring.png','r1':'gpt-assets/bosses/boss_1_ring.png','r2':'gpt-assets/bosses/boss_2_ring.png','r3':'gpt-assets/bosses/boss_3_ring.png','r4':'gpt-assets/bosses/boss_4_ring.png','np1':'gpt-assets/bosses/boss_5_phase1.png','np2':'gpt-assets/bosses/boss_5_phase1_b.png','np3':'gpt-assets/bosses/boss_5_phase1_c.png','fu1':'gpt-assets/bosses/b5_entity.png','fu2':'gpt-assets/bosses/b5_fusion_mid1.png','fu3':'gpt-assets/bosses/b5_fusion_mid2.png','od1':'gpt-assets/fx/od_aura_1.png','od2':'gpt-assets/fx/od_aura_2.png','od3':'gpt-assets/fx/od_aura_3.png','od4':'gpt-assets/fx/od_aura_4.png'
}
enames=['small_fighter','medium_fighter','scout','bomber','mech','interceptor','aegis_warden','rail_lancer','mine_seeder','fractal_shard','kaleido_prism','echo_warden']
for bi in range(1,6):
    for ph in range(1,4): assets['b%d_%d'%(bi,ph)]='gpt-assets/bosses/boss_%d_phase%d.png'%(bi,ph)
for ei in range(1,13):
    assets['n%d'%ei]='gpt-assets/enemies/%02d_%s_1.png'%(ei,enames[ei-1])
    p2='gpt-assets/enemies/%02d_%s_2.png'%(ei,enames[ei-1])
    if os.path.exists(p2): assets['n%db'%ei]=p2
for i in range(1,9): assets['e%d'%i]='gpt-assets/explosions/explosion_%02d.png'%i
js="var GIMG={};\n"
for k,p in assets.items():
    js+="GIMG.%s=new Image();GIMG.%s.src='data:image/png;base64,%s';\n"%(k,k,base64.b64encode(open(p,'rb').read()).decode())
a=prefix.index('var GIMG={};'); b=prefix.index('var BG1=')
prefix=prefix[:a]+js+prefix[b:]
prefix=prefix.replace('<title>BOSS RUSH · rRootage Tribute</title>','<title>STELLAR ASSAULT · 4 Stages</title>')
specs="var specs=null;\ntry{ specs=XMLS.map(function(x){ return bulletml.buildXML(x); }); }catch(e){ console.error(e); }\n"
game=open('sfx_extra.js',encoding='utf-8').read()+"\n"+open('game3.js',encoding='utf-8').read()
html=prefix+specs+game+"\n})();\n</script>\n</body>\n</html>"
open('rrootage3.html','w',encoding='utf-8').write(html)
print('bytes',len(html),'images',len(assets))
