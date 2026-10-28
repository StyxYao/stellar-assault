import base64,os,re,json
s=open('bossrush.html',encoding='utf-8').read()
prefix=s[:s.index('var specs=null;')]
prefix=re.sub(r"BGMENU\.src='data:image/[^']+'", "BGMENU.src='assets/bg/menu.webp'", prefix, count=1)
assets={
 'p2':'player-v2/p2_center.png','p3':'player-v2/p3_right.png','p4':'player-v2/p4_left.png',
 'u1':'assets/bullets/u1n.png','u2':'assets/bullets/u2n.png','u4':'assets/bullets/u4n.png','u5':'assets/bullets/u5n.png','w1':'gpt-assets/player/wing-drone.png','hrA':'gpt-assets/bosses/hedron-rec-a.webp','hrB':'gpt-assets/bosses/hedron-rec-b.webp','hrC':'gpt-assets/bosses/hedron-rec-c.webp','kbA':'assets/bg/kaleido-rec-a.webp','kbB':'assets/bg/kaleido-rec-b.webp','s5e1':'gpt-assets/s5/e1.png','s5e2':'gpt-assets/s5/e2.png','s5e3':'gpt-assets/s5/e3.png','s5e4':'gpt-assets/s5/e4.png','s5e5':'gpt-assets/s5/e5.png','s5e6':'gpt-assets/s5/e6.png','s5b1':'gpt-assets/s5/b1.png','s5b2':'gpt-assets/s5/b2.png','s5b3':'gpt-assets/s5/b3.png','s5b4':'gpt-assets/s5/b4.png','s5b5':'gpt-assets/s5/b5.png','s5b6':'gpt-assets/s5/b6.png','q1':'gpt-assets/bosses/boss_1_phase3_ring.png','q2':'gpt-assets/bosses/boss_2_phase3_ring.png','q3':'gpt-assets/bosses/boss_3_phase3_ring.png','q4':'gpt-assets/bosses/boss_4_phase3_ring.png','r1':'gpt-assets/bosses/boss_1_ring.png','r2':'gpt-assets/bosses/boss_2_ring.png','r3':'gpt-assets/bosses/boss_3_ring.png','r4':'gpt-assets/bosses/boss_4_ring.png','np1':'gpt-assets/bosses/boss_5_phase1.png','np2':'gpt-assets/bosses/boss_5_phase1_b.png','np3':'gpt-assets/bosses/boss_5_phase1_c.png','fu1':'gpt-assets/bosses/b5_entity.png','fu2':'gpt-assets/bosses/b5_fusion_mid1.png','fu3':'gpt-assets/bosses/b5_fusion_mid2.png','od1':'gpt-assets/fx/od_aura_1.png','od2':'gpt-assets/fx/od_aura_2.png','od3':'gpt-assets/fx/od_aura_3.png','od4':'gpt-assets/fx/od_aura_4.png','sk_vector_void_lance':'assets/ships/vector_void_lance.png','sk_vector_starfall':'assets/ships/vector_starfall.png','sk_vector_abyss':'assets/ships/vector_abyss.png','sk_aegis_orbital':'assets/ships/aegis_orbital.png','sk_aegis_void_echo':'assets/ships/aegis_void_echo.png','sk_aegis_temporal':'assets/ships/aegis_temporal.png','sk_phantom_raven':'assets/ships/phantom_raven.png','sk_phantom_quantum':'assets/ships/phantom_quantum.png','sk_phantom_butterfly':'assets/ships/phantom_butterfly.png','aegis_field':'assets/fx/aegis_force_field.png','aegis_field1':'assets/fx/aegis_force_field_1.png','aegis_field2':'assets/fx/aegis_force_field_2.png','aegis_field3':'assets/fx/aegis_force_field_3.png','aegis_field4':'assets/fx/aegis_force_field_4.png','brand_emblem':'assets/branding/logo-emblem.png','brand_title':'assets/branding/logo-title.png','brand_title_stack':'assets/branding/logo-title-stacked.png'
}
enames=['small_fighter','medium_fighter','scout','bomber','mech','interceptor','aegis_warden','rail_lancer','mine_seeder','fractal_shard','kaleido_prism','echo_warden']
for bi in range(1,6):
    for ph in range(1,4): assets['b%d_%d'%(bi,ph)]='gpt-assets/bosses/boss_%d_phase%d.png'%(bi,ph)
for ei in range(1,13):
    assets['n%d'%ei]='gpt-assets/enemies/%02d_%s_1.png'%(ei,enames[ei-1])
    p2='gpt-assets/enemies/%02d_%s_2.png'%(ei,enames[ei-1])
    if os.path.exists(p2): assets['n%db'%ei]=p2
for i in range(1,9): assets['e%d'%i]='gpt-assets/explosions/explosion_%02d.png'%i
js="var GIMG={};var GIMG_SRC={};var GIMG_CACHE={};\n"
for k,p in assets.items():
    js+="GIMG_SRC[%r]='data:image/png;base64,%s';\n"%(k,base64.b64encode(open(p,'rb').read()).decode())
js+="Object.keys(GIMG_SRC).forEach(function(k){Object.defineProperty(GIMG,k,{configurable:true,enumerable:true,get:function(){if(!GIMG_CACHE[k]){var im=new Image();im.src=GIMG_SRC[k];GIMG_CACHE[k]=im;}return GIMG_CACHE[k];}});});\n"
a=prefix.index('var GIMG={};'); b=prefix.index('var BG1=')
prefix=prefix[:a]+js+prefix[b:]
prefix=prefix.replace('<title>BOSS RUSH · rRootage Tribute</title>','<title>STELLAR ASSAULT · 5 Stages</title>')
specs="var specs=null;\ntry{ specs=XMLS.map(function(x){ return bulletml.buildXML(x); }); }catch(e){ console.error(e); }\n"
manifest=json.load(open('src/modules.json',encoding='utf-8'))
module_parts=[]
for rel in manifest['modules']:
    module_parts.append('// ---- '+rel+' ----\n'+open(rel,encoding='utf-8').read())
game=open('src/legacy/sfx-extra.js',encoding='utf-8').read()+"\n"+"\n".join(module_parts)+"\n"+open('src/legacy/game.js',encoding='utf-8').read()
html=prefix+specs+game+"\n})();\n</script>\n</body>\n</html>"
open('rrootage3.html','w',encoding='utf-8').write(html)
print('bytes',len(html),'images',len(assets),'modules',len(manifest['modules']))
