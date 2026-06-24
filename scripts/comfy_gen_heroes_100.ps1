﻿﻿﻿<#
.SYNOPSIS
  生成 100 张三国武将立绘 PNG（半身或全身），暗背景 + 鎏金边缘光，置于 public/img/heroes/
  风格统一：中国水墨工笔 + 电影写实光影
  视觉差异化：盔甲色（按势力）/ 武器（按武力&历史）/ 面相&年龄 / 表情（按性格）
#>

param(
  [string]$ComfyUrl = 'http://127.0.0.1:8188',
  [string]$Ckpt = 'sd_xl_base_1.0.safetensors',
  [int]$Steps = 32,
  [double]$Cfg = 7.5,
  [string]$Sampler = 'dpmpp_2m',
  [string]$Scheduler = 'karras',
  [int]$Width = 832,
  [int]$Height = 1152,
  [string]$OutDir = 'public\img\heroes'
)

$ErrorActionPreference = 'Stop'

$BASE = "full body portrait, standing pose, isolated on solid dark obsidian background, " +
        "ancient chinese ink wash painting style fused with cinematic realism, " +
        "dramatic rim lighting from upper left, soft golden volumetric light, " +
        "ultra detailed armor textures, intricate engravings, photorealistic faces, " +
        "octane render, 8k, single character, museum quality, masterpiece"

$NEG = "multiple people, crowd, modern clothing, low quality, blurry, jpeg artifacts, " +
       "text, watermark, logo, signature, deformed face, extra limbs, bad anatomy, " +
       "cartoon, anime, 3d render style, lowres, ugly, bad hands"

# 100 武将差异化 prompt（faction 决定主色调，stats 决定文/武/帅形象，name 决定典型符号）
$HEROES = @(
  # ===== legend 10 =====
  @{ name='lvbu';         prompt = "fierce ancient chinese warlord general Lu Bu, red phoenix-wing helmet plume, dark crimson lacquered armor with golden dragon engravings, holding the legendary Sky-Piercer ji halberd, intense piercing tiger eyes, mid 30s, long jet-black hair flowing, arrogant battle-hungry smirk, " + $BASE },
  @{ name='zhuge';        prompt = "wise serene ancient chinese strategist Zhuge Liang, white silk robe with cloud embroidery, black scholar's lun jin headpiece, holding white crane feather fan, calm intelligent gaze, mid 40s, thin elegant beard, faint knowing smile, " + $BASE },
  @{ name='caocao';       prompt = "shrewd ancient chinese warlord Cao Cao, midnight indigo silk court robe over dark steel scaled cuirass, golden phoenix waist sash, holding ornate sword Yitian, narrow calculating eyes, late 40s, short black beard, cunning ambitious smile, " + $BASE },
  @{ name='liubei';       prompt = "benevolent ancient chinese sovereign Liu Bei, deep vermilion silk imperial robe with twin-dragon embroidery, jade belt, long earlobes, gentle compassionate eyes, late 30s, soft mustache, warm dignified expression, " + $BASE },
  @{ name='sunce';        prompt = "young heroic Jiangdong warlord Sun Ce, bright emerald lacquered chest armor with silver tiger pauldrons, holding a long ji halberd, sharp falcon eyes, early 20s, clean shaven, bold radiant grin, " + $BASE },
  @{ name='zhouyu';       prompt = "handsome young Wu commander Zhou Yu, jade-green silk war robe layered over fine fish-scale armor, holding a gilded conductor's baton, refined chiseled face, mid 20s, neat thin mustache, composed elegant smile, " + $BASE },
  @{ name='sima';         prompt = "patient cunning Wei strategist Sima Yi, charcoal black confucian robe with subtle silver crane embroidery, dark scholar hat, holding a bamboo slip scroll, hawk eyes glancing sideways (wolf-look), mid 40s, sparse beard, restrained cold smile, " + $BASE },
  @{ name='guanyu';       prompt = "ancient chinese legendary general Guan Yu, deep green silk war robe over bronze armor, long flowing magnificent black beard reaching chest, holding crescent-moon Green Dragon Yanyue blade, stern righteous expression, ruddy red face, narrowed phoenix eyes, " + $BASE },
  @{ name='zhaoyun';      prompt = "young dashing Shu general Zhao Yun, polished silver white phoenix-wing armor with sky-blue silk underrobe, holding bright silver Dragon Gallop spear, white horsehair plume, handsome youthful face, mid 20s, calm confident eyes, " + $BASE },
  @{ name='guojia';       prompt = "frail brilliant Wei advisor Guo Jia, pale lavender thin silk robe slightly disheveled, no armor, holding rolled bamboo strategy scroll, pale unhealthy complexion, late 20s, sparse short beard, mischievous knowing smirk, " + $BASE },

  # ===== epic 24 =====
  @{ name='zhangfei';     prompt = "fierce burly Shu general Zhang Fei, black iron armor with bronze rivets and crimson sash, thick bristling black beard like halberd points, wide tiger eyes glaring, holding eighteen-foot serpent spear Zhangba Shemao, mid 30s, dark stormy aura, roaring open mouth, " + $BASE },
  @{ name='machao';       prompt = "noble western Shu cavalry general Ma Chao, silver-white lion-mask armor with vermilion silk cloak, holding long lance, white tiger-pelt cape, handsome stern face with western features, mid 20s, neat moustache, vengeful cold eyes, " + $BASE },
  @{ name='huangzhong';   prompt = "veteran archer Shu general Huang Zhong, dull olive bronze scaled armor, brown leather quiver, holding massive yellow lacquered longbow drawn taut, weathered tanned face, long fully white beard and hair, 60s, fierce undimmed eyes, " + $BASE },
  @{ name='weiyan';       prompt = "rugged Shu general Wei Yan, sun-burnt dark red armor with rough iron plates, holding curved dao saber, shaved sides with topknot, sharp scar across cheek, early 30s, untrustworthy sneering grin, " + $BASE },
  @{ name='jiangwei';     prompt = "young Shu inheritor general Jiang Wei, slate-grey fine lamellar armor with crimson under-robe and white silk cloak, holding both a sword and a bamboo military map, intelligent determined eyes, mid 20s, clean shaven, resolute calm expression, " + $BASE },
  @{ name='pangtong';     prompt = "ugly genius Shu strategist Pang Tong, dusty earth-brown plain hemp robe, no headpiece, messy short hair, holding a worn bamboo book, deliberately unsightly broad nose and thick eyebrows, early 30s, sardonic clever smile, " + $BASE },
  @{ name='fazheng';      prompt = "sly Shu advisor Fa Zheng, deep maroon scholar robe with black trim, holding a folded paper plan, narrow eyes plotting revenge, early 40s, thin pointed beard, sharp triumphant smirk, " + $BASE },
  @{ name='dianwei';      prompt = "mighty Wei bodyguard Dian Wei, dark oxblood leather armor over bare muscular shoulders, holding two heavy iron ji halberds (paired), unkempt wild black hair and full beard, mid 30s, fierce loyal scarred face, snarling, " + $BASE },
  @{ name='xuchu';        prompt = "burly Wei guard Xu Chu, rough rust-iron breastplate over tanned bare arms, holding a giant battle axe, round bull-like face, thick black beard, mid 20s, blunt fearless grin, nicknamed Tiger Fool, " + $BASE },
  @{ name='xiahoudun';    prompt = "one-eyed Wei general Xiahou Dun, deep navy-black armor with silver dragon clasps, black silk eyepatch over left eye, holding spear, dark short beard, late 30s, grim solemn expression, " + $BASE },
  @{ name='xiahouyuan';   prompt = "swift Wei cavalry general Xiahou Yuan, midnight blue light leather armor, holding a long composite bow with arrow nocked, lean wind-burnt face, mid 30s, short trimmed beard, focused archer's gaze, " + $BASE },
  @{ name='zhangliao';    prompt = "elite Wei commander Zhang Liao, steel-blue lamellar armor with golden chest emblem, holding a long Pudao glaive, dignified handsome face, late 30s, well-groomed beard, calm authoritative stare (the dread of Hefei), " + $BASE },
  @{ name='zhanghe';      prompt = "graceful Wei general Zhang He, pale gunmetal armor with elaborate engraved cloud patterns and silk tassels, holding a long spear, almost effeminate refined features, mid 30s, neat thin moustache, subtle elegant smile, " + $BASE },
  @{ name='xuhuang';      prompt = "stoic Wei commander Xu Huang, dark iron-grey armor, holding a long-handled great axe, square honest face, broad shoulders, early 40s, thick straight beard, disciplined serious frown, " + $BASE },
  @{ name='xunyu';        prompt = "noble Wei prime advisor Xun Yu, immaculate white-and-indigo silk court robe with jade pendants, tall scholar hat, holding ivory court tablet, fragrant orchid air, refined handsome face, late 30s, thin neat beard, melancholy upright expression, " + $BASE },
  @{ name='jiaxu';        prompt = "sinister Wei advisor Jia Xu, dark plum-purple robe with hidden silver thread, hood half drawn, holding a small lacquered fan, sallow gaunt face, deep-set venomous eyes, 50s, sparse grey beard, cold thin smile, " + $BASE },
  @{ name='taishici';     prompt = "Wu duel hero Taishi Ci, teal-green scaled cuirass with seafoam silk sash, holding twin short ji halberds with bow on back, sharp determined eyes, late 20s, short black beard, brave open expression, " + $BASE },
  @{ name='ganning';      prompt = "Wu river pirate turned general Gan Ning, dark green leather vest exposing tattooed muscular arms, brass bells on belt, holding a curved cutlass and chain, wild long hair tied loose, early 30s, reckless wolfish grin, " + $BASE },
  @{ name='lvmeng';       prompt = "studious Wu commander Lu Meng, jade-green silk robe over light scale armor, holding both a sword and an open book, transformed scholarly face, mid 30s, neat short beard, thoughtful confident smile, " + $BASE },
  @{ name='luxun';        prompt = "young Wu strategist Lu Xun, pale celadon silk scholar robe over fine silver armor, holding a folded fan and a fire-arrow, refined youthful face, early 20s, clean shaven, quiet brilliant gaze, " + $BASE },
  @{ name='huanggai';     prompt = "old Wu veteran Huang Gai, weathered bronze-and-green armor with whip scars showing on bare back, holding heavy iron whip and torch, sun-darkened face, long grey beard, 60s, grim self-sacrificing expression, " + $BASE },
  @{ name='zhouyu_jr';    prompt = "graceful Wu noblewoman Xiao Qiao, flowing pale jade-green hanfu with peach-blossom embroidery, silver hairpins, holding a round silk fan, delicate beautiful face, late teens, gentle melancholy smile, " + $BASE },
  @{ name='huatuo';       prompt = "wandering miracle physician Hua Tuo, plain earth-brown daoist robe with herb pouch, carrying acupuncture needle case and small gourd, kind wise face, 50s, long thin white beard, serene healing smile, " + $BASE },
  @{ name='diaochan';     prompt = "legendary Han beauty Diao Chan, flowing crimson and gold palace silk hanfu, golden phoenix hairpiece, holding pipa lute, exquisite delicate face, early 20s, faint sorrowful captivating smile, " + $BASE },

  # ===== rare 30 =====
  @{ name='guanping';     prompt = "young Shu general Guan Ping, deep green scaled armor matching his father, holding a sword, handsome filial face, early 20s, clean shaven, loyal determined eyes, " + $BASE },
  @{ name='liaohua';      prompt = "long-lived Shu veteran Liao Hua, faded vermilion armor patched with brown leather, holding a worn dao saber, weathered tired face, 60s, long grey beard, steady persevering expression, " + $BASE },
  @{ name='mengda';       prompt = "Shu turncoat general Meng Da, mottled brown-and-red half armor over loose silk robe, holding a sword, narrow shifty eyes, mid 30s, thin moustache, sly cautious smile, " + $BASE },
  @{ name='majiale';      prompt = "Shu cavalry officer Ma Dai, dusty red leather cuirass with white horse motif, holding a curved sabre, lean western features, late 20s, thin moustache, alert vigilant expression, " + $BASE },
  @{ name='wangping';     prompt = "Shu mountain general Wang Ping, plain dark brown leather armor with rope details, holding a shield and short dao, dark tanned square face, early 30s, full beard, careful watchful eyes (illiterate but wise), " + $BASE },
  @{ name='jianyong';     prompt = "Shu envoy Jian Yong, pale beige scholar robe with bamboo-leaf pattern, holding a wine gourd, lean witty face, mid 30s, thin moustache, irreverent humorous smile, " + $BASE },
  @{ name='sunqian';      prompt = "Shu diplomat Sun Qian, light tan silk robe with brown trim, holding rolled letter scroll, gentle scholarly face, late 30s, neat short beard, polite measured smile, " + $BASE },
  @{ name='caoren';       prompt = "stalwart Wei defender Cao Ren, heavy dark-blue iron armor with reinforced shoulder plates, holding a long spear and shield, square stoic face, late 30s, full short beard, immovable defensive stance, " + $BASE },
  @{ name='caohong';      prompt = "Wei loyalist Cao Hong, midnight blue armor with golden Cao clan crest, holding a sword, broad muscular build, early 30s, thick beard, fierce devoted expression, " + $BASE },
  @{ name='caoxiu';       prompt = "young Wei cavalry Cao Xiu (the Thousand Li Colt), sleek navy lamellar armor with silver horse insignia, holding a riding whip and sword, agile lean build, mid 20s, clean shaven, eager bright eyes, " + $BASE },
  @{ name='lidian';       prompt = "scholarly Wei officer Li Dian, slate-blue armor over indigo scholar robe, holding a book and short sword together, gentle calm face, late 20s, thin neat beard, refined polite smile, " + $BASE },
  @{ name='yujin';        prompt = "disciplinarian Wei general Yu Jin, austere dark blue armor without ornament, holding a baton of command, severe square face, 40s, neat short beard, unforgiving stern frown, " + $BASE },
  @{ name='yueyi';        prompt = "vanguard Wei officer Yue Jin, navy half-armor scratched from battle, holding a short dao saber, small but wiry body, late 20s, clean shaven, ferocious eager grin, " + $BASE },
  @{ name='mancong';      prompt = "Wei magistrate-general Man Chong, dark blue official robe over light armor, holding a legal scroll, sharp severe face, 40s, thin sharp beard, uncompromising cold gaze, " + $BASE },
  @{ name='chenggong';    prompt = "early Wei strategist Cheng Yu, midnight indigo confucian robe, holding bamboo scroll and brush, tall thin frame (over eight chi), 50s, long grey beard, deep penetrating eyes, " + $BASE },
  @{ name='liushaoshou';  prompt = "Wei imperial-clan advisor Liu Ye, royal dark-purple robe with silver dragon trim, holding a folded silk fan, refined aristocratic face, mid 30s, thin moustache, perceptive calm smile, " + $BASE },
  @{ name='lusu';         prompt = "honest Wu strategist Lu Su, sea-green silk robe over light scale armor, holding rolled map of the realm, broad-shouldered tall frame, late 30s, full kind beard, sincere generous smile, " + $BASE },
  @{ name='zhouyou';      prompt = "battle-scarred Wu guard Zhou Tai, teal armor with bare scarred arms showing dozens of sword wounds, holding a sword, fierce loyal face, mid 30s, short beard, grim survivor stare, " + $BASE },
  @{ name='chengpu';      prompt = "veteran Wu general Cheng Pu, dark green-and-bronze armor with old-style helmet, holding a long iron spine spear, weathered honest face, 50s, full grey beard, dignified senior expression, " + $BASE },
  @{ name='hanke';        prompt = "Wu founding officer Han Dang, mossy green scaled armor with leather straps, holding a long-handled axe, square reliable face, 40s, dark short beard, stoic loyal expression, " + $BASE },
  @{ name='jiangqin';     prompt = "Wu naval captain Jiang Qin, dark teal lacquered armor with wave patterns and salt stains, holding boarding hook and dao, suntanned sailor face, early 30s, short beard, weathered tough smile, " + $BASE },
  @{ name='dingfeng';     prompt = "Wu cold-weather hero Ding Feng, frosted pale-green armor over fur cloak, holding a short ji halberd in bare arms, snow on shoulders, late 20s, clean shaven, fierce determined breath visible, " + $BASE },
  @{ name='xushen';       prompt = "defensive Wu general Xu Sheng, dark cyan armor with reinforced bracers, holding a long spear, square dependable face, mid 30s, neat short beard, alert defender's gaze, " + $BASE },
  @{ name='zhugejin';     prompt = "Wu diplomat Zhuge Jin, pale green-grey silk scholar robe (elder brother of Zhuge Liang), distinctive long face (donkey-faced legend), holding a diplomatic scroll, 40s, thin elegant beard, polite restrained smile, " + $BASE },
  @{ name='panzhang';     prompt = "ruthless Wu officer Pan Zhang, dark teal-black armor with looted crimson silk sash (took Guan Yu's blade), holding a captured curved blade, greedy fierce face, early 30s, rough beard, cruel triumphant grin, " + $BASE },
  @{ name='huaxiong';     prompt = "Liang-zhou warlord captain Hua Xiong, dark rust-brown heavy armor with wolf-fur trim, holding a massive broadsword, brutish wide face, early 30s, thick black beard, arrogant boasting expression, " + $BASE },
  @{ name='yanliang';     prompt = "Hebei champion Yan Liang, dull bronze heavy armor with twin-tiger pauldrons, holding a long-handled dao saber, broad square face, mid 30s, full black beard, intimidating heavy stare, " + $BASE },
  @{ name='wenchou';      prompt = "Hebei champion Wen Chou, mottled dark-iron armor matching Yan Liang as a pair, holding a long spear, fierce wild face, mid 30s, thick beard, raging battle-glare, " + $BASE },
  @{ name='yuanshao';     prompt = "noble warlord Yuan Shao, lavish gold-and-vermilion silk court armor with four-generation insignia, holding ornate sword, aristocratic handsome face, 40s, well-groomed beard, vain proud expression, " + $BASE },
  @{ name='dongzhuo';     prompt = "tyrant warlord Dong Zhuo, brutal dark-bronze armor straining over enormous fat belly, holding a heavy curved dao, oily greasy face, 50s, thick wild beard, cruel lecherous grin, " + $BASE },

  # ===== common 36 =====
  @{ name='liubang';      prompt = "frail Jingzhou heir Liu Qi, pale jade-yellow silk robe (no armor), holding a folding fan, sickly thin face, early 20s, wispy moustache, anxious gentle expression, " + $BASE },
  @{ name='mizhu';        prompt = "Shu merchant patron Mi Zhu, rich amber-yellow brocade silk robe with coin patterns, holding an abacus and ledger, plump prosperous face, 40s, neat short beard, generous benevolent smile, " + $BASE },
  @{ name='wuyi';         prompt = "Shu clan general Wu Yi, deep crimson scaled armor with silver phoenix clasps, holding a sword, refined noble face, late 30s, neat beard, dignified courteous expression, " + $BASE },
  @{ name='fuxi';         prompt = "old Shu veteran soldier, faded rust-red patched armor, holding a chipped spear, deeply wrinkled tanned face, 60s, long grey beard, weary determined eyes, " + $BASE },
  @{ name='zhangyi';      prompt = "Shu veteran general Zhang Yi, dark vermilion armor with bronze rivets, holding a long spear, sun-aged tough face, 50s, grey short beard, dependable steady expression, " + $BASE },
  @{ name='zhangni';      prompt = "Shu southern frontier general Zhang Ni, red-brown leather armor with southern tribal beads, holding a sword, tanned weathered face, 40s, short black beard, charismatic kind smile, " + $BASE },
  @{ name='mafu';         prompt = "Shu southern pacifier Ma Zhong, brick-red light armor with leather straps, holding a sword and tribal pacification edict, calm bureaucratic face, 40s, neat beard, patient firm expression, " + $BASE },
  @{ name='lufeng';       prompt = "Shu southern scholar Lu Kai, sandy-tan silk robe with map of Nanzhong tucked into belt, holding a rolled map, scholarly southern face, mid 30s, thin moustache, attentive helpful smile, " + $BASE },
  @{ name='liyan';        prompt = "Shu regent minister Li Yan, dark crimson court robe with imperial seal pouch, holding ivory tablet, dignified handsome face, 50s, full grey beard, ambitious complicated expression, " + $BASE },
  @{ name='gaoxiang';     prompt = "Shu lower-rank old general Gao Xiang, faded brick-red armor mended with brown patches, holding a spear, grey wrinkled face, 60s, long thin beard, calm experienced expression, " + $BASE },
  @{ name='mengyou';      prompt = "southern Nanman vice-king Meng You, exotic leopard-pelt armor with brown skin and bone necklaces, holding a curved tribal blade, dark-skinned wild face, mid 30s, no beard, naive bold smile, " + $BASE },
  @{ name='caorenmin';    prompt = "Wei poet prince Cao Zhi, elegant dark sapphire silk poet's robe with golden constellation embroidery, holding a brush and wine cup, slender handsome melancholic face, early 20s, thin moustache, lyrical sorrowful smile, " + $BASE },
  @{ name='caopi';        prompt = "Wei emperor Cao Pi, imperial midnight-blue dragon robe with twelve symbols, golden mianliu crown with jade beads, holding jade scepter, cold handsome face, late 20s, thin moustache, regal calculating expression, " + $BASE },
  @{ name='caozhang';     prompt = "Wei warrior prince Cao Zhang, dark indigo armor with golden tiger emblem, distinctive bright yellow beard (the Yellow-Beard), holding a long spear, muscular young face, mid 20s, fierce eager grin, " + $BASE },
  @{ name='caozhen';      prompt = "Wei marshal Cao Zhen, deep navy heavy armor with imperial Cao crest, holding command baton and sword, broad noble face, 40s, full beard, commanding confident expression, " + $BASE },
  @{ name='simashi';      prompt = "cold Wei successor Sima Shi, charcoal-black armor with silver crane embroidery, single sword at side, pale calm face with one eye slightly swollen (tumor), 30s, thin beard, ruthless quiet smile, " + $BASE },
  @{ name='simazhao';     prompt = "ambitious Wei usurper Sima Zhao, dark slate court robe over light armor, holding sword and silk court fan, sharp handsome face, 30s, thin moustache, openly ambitious smirk, " + $BASE },
  @{ name='zhongyao';     prompt = "Wei calligrapher minister Zhong Yao, deep indigo scholar court robe, holding brush and silk scroll showing kaishu calligraphy, refined elderly face, 60s, long grey beard, scholarly serene smile, " + $BASE },
  @{ name='wangxiang';    prompt = "Wei elder minister Wang Lang, formal navy court robe with silver crane patch, holding ivory court tablet, plump arrogant face, 60s, full white beard, pompous self-righteous expression, " + $BASE },
  @{ name='maojie';       prompt = "incorruptible Wei official Mao Jie, plain dark-blue official robe without ornament, holding a plain bamboo slip, austere thin face, 40s, sparse short beard, upright honest expression, " + $BASE },
  @{ name='sunquan';      prompt = "Wu emperor Sun Quan, imperial emerald-and-gold dragon robe over light armor, distinctive bright bluish-green eyes (Blue-Eyed Child) and reddish beard, holding jade seal, square handsome face, 30s, full red beard, sovereign decisive expression, " + $BASE },
  @{ name='sunjian';      prompt = "founding Wu warlord Sun Jian (Jiangdong Tiger), deep forest-green tiger-stripe armor with red sash, holding ancient sword (Gu Ding sword), brave handsome face, mid 30s, strong beard, ferocious tiger-like glare, " + $BASE },
  @{ name='sunshangxiang';prompt = "warrior princess Sun Shang Xiang, elegant red-and-emerald lady's armor with phoenix shoulders, holding a bow and short sword, beautiful athletic face, early 20s, sharp playful eyes, confident bold smile, " + $BASE },
  @{ name='erqiao_da';    prompt = "Wu noblewoman Da Qiao, flowing pale jade-green and white silk hanfu, jade hairpins, holding a round palace fan, elegant beautiful sorrowful face (widow of Sun Ce), early 20s, soft melancholy smile, " + $BASE },
  @{ name='zhanghong';    prompt = "Wu founding minister Zhang Zhao, formal dark green court robe with silver crane patch, holding ivory tablet, severe square face, 60s, long grey beard, blunt outspoken expression, " + $BASE },
  @{ name='zhanggu';      prompt = "Wu scholar minister Zhang Hong, sea-green silk scholar robe, holding brush and bamboo strip, refined diplomatic face, 50s, neat grey beard, eloquent calm smile, " + $BASE },
  @{ name='gulong';       prompt = "Wu prime minister Gu Yong, mossy-green official robe with jade pendants, holding ivory tablet, silent reserved face (famously quiet), 60s, neat white beard, stern unreadable expression, " + $BASE },
  @{ name='zhuzhi';       prompt = "Wu prefect general Zhu Zhi, dark teal armor with leather coat, holding a sword and county seal, square loyal face, 50s, full beard, steady dependable expression, " + $BASE },
  @{ name='zhuran';       prompt = "Wu garrison commander Zhu Ran, deep sea-green lacquered armor with iron studs (defender of Jiangling), holding a long spear, square serious face, 40s, neat black beard, vigilant defensive gaze, " + $BASE },
  @{ name='lingong';      prompt = "young Wu officer Ling Tong, emerald-green light armor with white silk underrobe, holding a short ji halberd, sharp youthful face full of grief (avenging his father), late 20s, clean shaven, fierce burning eyes, " + $BASE },
  @{ name='huafa';        prompt = "scholar-turned-official Hua Xin, plain dark grey scholar robe (later Wei minister), holding a single bamboo slip, lean opportunistic face, 50s, sparse beard, calculating polite smile, " + $BASE },
  @{ name='guanning';     prompt = "reclusive Han hermit Guan Ning, simple ash-grey hemp scholar robe with woven sash, sitting-mat motif, holding rolled classic text, serene ascetic face, 50s, long white beard, detached transcendent smile, " + $BASE },
  @{ name='zuoci';        prompt = "mystical taoist sorcerer Zuo Ci, ragged earth-brown taoist robe with eight-trigram patches, holding a fishing rod producing magical carp, gaunt cryptic face with one cloudy eye, 70s, long wispy white beard, mischievous unworldly grin, " + $BASE },
  @{ name='yujishi';      prompt = "Han taoist priest Yu Ji, pristine white daoist robe with red taiji emblem, holding a peachwood sword and amulet, gentle pale face, 60s, long thin white beard, beatific holy smile, " + $BASE },
  @{ name='gongsunzan';   prompt = "northern warlord Gongsun Zan (White Horse General), gleaming polished white-silver armor with white wolf-fur cape, holding a long spear, handsome rugged face, late 30s, well-kept short beard, proud cavalry-commander stare, " + $BASE },
  @{ name='liuzhang';     prompt = "weak Yizhou governor Liu Zhang, soft cream-yellow silk court robe with faded dragon embroidery, holding ivory tablet limply, plump pale indecisive face, 40s, thin sparse beard, timid worried expression, " + $BASE }
)

function New-Workflow {
  param([string]$Pos, [string]$Neg, [int]$Seed, [string]$FilenamePrefix)
  $wf = @{
    "3" = @{ class_type = "CheckpointLoaderSimple"; inputs = @{ ckpt_name = $Ckpt } }
    "4" = @{ class_type = "CLIPTextEncode";        inputs = @{ text = $Pos; clip = @("3", 1) } }
    "5" = @{ class_type = "CLIPTextEncode";        inputs = @{ text = $Neg; clip = @("3", 1) } }
    "6" = @{ class_type = "EmptyLatentImage";      inputs = @{ width = $Width; height = $Height; batch_size = 1 } }
    "7" = @{ class_type = "KSampler"; inputs = @{
        seed = $Seed; steps = $Steps; cfg = $Cfg; sampler_name = $Sampler; scheduler = $Scheduler;
        denoise = 1.0; model = @("3", 0); positive = @("4", 0); negative = @("5", 0); latent_image = @("6", 0)
    } }
    "8" = @{ class_type = "VAEDecode"; inputs = @{ samples = @("7", 0); vae = @("3", 2) } }
    "9" = @{ class_type = "SaveImage"; inputs = @{ filename_prefix = $FilenamePrefix; images = @("8", 0) } }
  }
  return @{ prompt = $wf } | ConvertTo-Json -Depth 12
}

function Invoke-ComfyOne {
  param([string]$Name, [string]$Pos)
  $seed = Get-Random -Maximum 2147483647
  $body = New-Workflow -Pos $Pos -Neg $NEG -Seed $seed -FilenamePrefix "sg_hero_$Name"

  Write-Host "[$Name] queue (seed=$seed)..." -ForegroundColor Cyan
  $r = Invoke-RestMethod -Uri "$ComfyUrl/prompt" -Method Post -ContentType 'application/json' -Body $body
  $promptId = $r.prompt_id

  $deadline = (Get-Date).AddMinutes(5)
  $outs = $null
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 1500
    try {
      $h = Invoke-RestMethod -Uri "$ComfyUrl/history/$promptId" -Method Get
      if ($h.$promptId -and $h.$promptId.outputs) { $outs = $h.$promptId.outputs; break }
    } catch { }
  }
  if (-not $outs) { throw "[$Name] poll timeout" }

  $img = $null
  foreach ($k in $outs.PSObject.Properties.Name) {
    if ($outs.$k.images) { $img = $outs.$k.images[0]; break }
  }
  if (-not $img) { throw "[$Name] no images" }

  $viewUrl = "$ComfyUrl/view?filename=$([uri]::EscapeDataString($img.filename))&subfolder=$([uri]::EscapeDataString($img.subfolder))&type=$($img.type)"
  if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }
  $outPath = Join-Path $OutDir "$Name.png"
  Invoke-WebRequest -Uri $viewUrl -OutFile $outPath -TimeoutSec 120
  $hash = (Get-FileHash $outPath -Algorithm MD5).Hash
  Write-Host "[$Name] OK -> $outPath (md5=$hash)" -ForegroundColor Green
  return @{ name = $Name; path = $outPath; hash = $hash }
}

Write-Host "ComfyUI: $ComfyUrl" -ForegroundColor Yellow
$probe = Invoke-RestMethod -Uri "$ComfyUrl/system_stats" -Method Get -TimeoutSec 5
Write-Host ("Device: " + $probe.devices[0].name) -ForegroundColor Yellow

$results = @()
$skipped = 0
$failed = @()
foreach ($it in $HEROES) {
  $existing = Join-Path $OutDir ($it.name + '.png')
  if (Test-Path $existing) {
    Write-Host "[$($it.name)] SKIP (exists)" -ForegroundColor DarkGray
    $skipped++
    continue
  }
  try {
    $results += Invoke-ComfyOne -Name $it.name -Pos $it.prompt
  } catch {
    Write-Host "[$($it.name)] FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $failed += $it.name
  }
}

Write-Host "`n==== SUMMARY ====" -ForegroundColor Yellow
Write-Host ("Generated: {0} | Skipped: {1} | Failed: {2}" -f $results.Count, $skipped, $failed.Count)
if ($failed.Count -gt 0) { Write-Host ("Failed: " + ($failed -join ', ')) -ForegroundColor Red }
$results | ForEach-Object { "{0,-14} md5={1}" -f $_.name, $_.hash } | Write-Host
if ($results.Count -gt 0) {
  $distinct = ($results | ForEach-Object { $_.hash } | Sort-Object -Unique).Count
  $color = if ($distinct -eq $results.Count) { 'Green' } else { 'Red' }
  Write-Host "Distinct hashes: $distinct / $($results.Count)" -ForegroundColor $color
}
