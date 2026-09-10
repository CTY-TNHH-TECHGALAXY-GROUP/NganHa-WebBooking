export type LocalizedString = Record<string, string>;

export interface FarmRetreatSection {
  id: string;
  heading: LocalizedString;
  paragraphs: LocalizedString[];
}

export interface FarmRetreatConfig {
  pageTitle: LocalizedString;
  pageSubtitle: LocalizedString;
  heroImage?: string;
  heroMediaType?: 'image' | 'video';
  heroWatermarkEnabled?: boolean;
  introParagraphs: LocalizedString[];
  storyPhotos?: string[];
  storyPhotosWatermark?: boolean[];
  sections: FarmRetreatSection[];
  highlights: Record<string, string[]>;
  closingText: LocalizedString;
  ctaText: LocalizedString;
  ctaLink: string;
}

export const DEFAULT_FARM_RETREAT_CONFIG: FarmRetreatConfig = {
  pageTitle: {
    vi: 'Oria Farm Retreat',
    en: 'Oria Farm Retreat',
    cn: 'Oria Farm Retreat',
    kr: 'Oria Farm Retreat',
    jp: 'Oria Farm Retreat',
  },
  pageSubtitle: {
    vi: 'Một ngày rời khỏi thành phố',
    en: 'A Day Away from the City',
    cn: '离开城市的一天',
    kr: '도시를 떠나는 하루',
    jp: '都会を離れる、1日だけの時間',
  },
  heroImage: '',
  heroMediaType: 'image',
  heroWatermarkEnabled: true,
  introParagraphs: [
    {
      vi: 'Không phải lúc nào bạn cũng cần một chuyến đi dài để thực sự được nghỉ ngơi.',
      en: 'You do not always need a long trip to truly rest.',
      cn: '真正的休息，并不一定需要一场漫长的旅行。',
      kr: '진정한 휴식을 위해 항상 긴 여행이 필요한 것은 아닙니다.',
      jp: '本当に休むために、いつも長い旅が必要なわけではありません。',
    },
    {
      vi: 'Đôi khi, chỉ cần rời khỏi thành phố trong một ngày.',
      en: 'Sometimes, all you need is one day away from the city.',
      cn: '有时候，只需要离开城市一天。',
      kr: '때로는 단 하루, 도시를 벗어나는 것만으로 충분합니다.',
      jp: 'ときには、たった1日、街を離れるだけでいい。',
    },
    {
      vi: 'Rời khỏi tiếng xe, lịch hẹn, màn hình và nhịp sống liên tục thúc mình phải đi nhanh hơn.',
      en: 'Away from traffic, appointments, screens, and the constant pace that keeps pushing you to move faster.',
      cn: '暂时远离车流、行程、屏幕，以及不断催促我们加快脚步的城市节奏。',
      kr: '차량 소음, 일정, 화면, 그리고 계속해서 더 빠르게 움직이게 만드는 도시의 속도에서 잠시 벗어나는 시간.',
      jp: '車の音、予定、スクリーン、そして常に自分を急がせる都会のペースから少し距離を置く。',
    },
    {
      vi: 'Oria Farm Retreat được tạo ra như một khoảng nghỉ trong ngày giữa thiên nhiên — nơi bạn có thể dành vài giờ hoặc cả ngày để ăn uống, nghỉ ngơi, xông hơi, tắm bồn và xoa bóp toàn thân, trước khi trở về thành phố với một nhịp hoàn toàn khác.',
      en: 'Oria Farm Retreat is created as a daytime escape surrounded by nature — a place where you can spend a few hours or an entire day enjoying food, resting, steaming, soaking in a bath, and receiving a full-body massage, before returning to the city with a completely different rhythm.',
      cn: 'Oria Farm Retreat 是一个被自然环绕的日间休憩空间。你可以在这里停留几个小时，或度过完整的一天，享受美食、休息、蒸汽桑拿、温水泡浴和全身按摩，然后以完全不同的状态回到城市。',
      kr: 'Oria Farm Retreat는 자연 속에서 보내는 데이 리트리트 공간입니다. 몇 시간 또는 하루 종일 머물며 음식을 즐기고, 쉬고, 스팀, 따뜻한 욕조 목욕, 전신 마사지를 경험한 뒤 한결 다른 리듬으로 도시로 돌아갈 수 있습니다.',
      jp: 'Oria Farm Retreat は、自然に囲まれて過ごすデイリトリートです。数時間でも、1日ゆっくりでも。食事を楽しみ、休み、スチーム、温かいバスタイム、全身マッサージを受けながら、いつもとはまったく違う時間の流れを感じてから街へ戻ることができます。',
    },
  ],
  storyPhotos: ['', '', '', '', ''],
  storyPhotosWatermark: [true, true, true, true, true],
  sections: [
    {
      id: 'sec-1',
      heading: {
        vi: 'Một bungalow riêng cho ngày của bạn',
        en: 'A Private Bungalow for Your Day',
        cn: '属于你一天的私人 Bungalow',
        kr: '하루를 위한 프라이빗 방갈로',
        jp: '1日のためのプライベート・バンガロー',
      },
      paragraphs: [
        {
          vi: 'Giữa không gian xanh của Oria Farm Retreat là những bungalow nhỏ dành riêng cho khách sử dụng trong ngày.',
          en: 'Surrounded by the greenery of Oria Farm Retreat are small private bungalows designed for daytime use.',
          cn: 'Oria Farm Retreat 的绿意之间，分布着专为日间使用而设计的小型私人 bungalow。',
          kr: 'Oria Farm Retreat의 푸른 자연 속에는 당일 이용을 위해 마련된 작은 프라이빗 방갈로가 있습니다.',
          jp: 'Oria Farm Retreat の緑の中には、日帰り利用のためにつくられた小さなプライベート・バンガローがあります。',
        },
        {
          vi: 'Đây không phải là phòng lưu trú qua đêm.',
          en: 'These are not overnight accommodation rooms.',
          cn: '这里并不是提供过夜住宿的客房。',
          kr: '숙박을 위한 객실은 아닙니다.',
          jp: '宿泊のための客室ではありません。',
        },
        {
          vi: 'Mỗi bungalow là một khoảng không gian riêng để bạn nghỉ giữa các trải nghiệm — nằm thư giãn, ngủ trưa, đọc sách, uống trà hoặc đơn giản là ngồi yên và tận hưởng thiên nhiên xung quanh.',
          en: 'Each bungalow is your own private space to rest between experiences — to lie down, take a nap, read, enjoy tea, or simply sit quietly and take in the natural surroundings.',
          cn: '每一间 bungalow 都是属于你的私人休息空间，让你可以在不同体验之间躺下放松、午睡、阅读、喝茶，或只是安静地坐着，感受周围的自然。',
          kr: '각 방갈로는 경험과 경험 사이에 오롯이 쉴 수 있는 나만의 공간입니다. 편안히 눕거나, 낮잠을 자거나, 책을 읽거나, 차를 마시거나, 그저 조용히 앉아 주변의 자연을 바라볼 수 있습니다.',
          jp: 'それぞれのバンガローは、体験と体験の間に自分だけの時間を過ごすための空間です。横になったり、昼寝をしたり、本を読んだり、お茶を楽しんだり、ただ静かに座って自然を感じたり。',
        },
        {
          vi: 'Không có lịch trình bắt buộc. Không cần liên tục di chuyển từ hoạt động này sang hoạt động khác. Bạn có thể dành cả ngày theo nhịp của riêng mình.',
          en: 'There is no fixed schedule you have to follow. There is no need to constantly move from one activity to another. You can spend the day entirely at your own pace.',
          cn: '没有必须遵循的固定行程。也不需要不断从一个活动赶往下一个活动。这一天，可以完全按照自己的节奏度过。',
          kr: '반드시 따라야 하는 정해진 일정은 없습니다. 한 활동이 끝나자마자 다음 활동으로 계속 이동할 필요도 없습니다. 그날의 시간은 온전히 자신의 속도에 맞춰 보낼 수 있습니다.',
          jp: '決められたスケジュールに従う必要はありません。次から次へと予定をこなす必要もありません。その日の過ごし方は、自分のペースで自由に決められます。',
        },
      ],
    },
    {
      id: 'sec-2',
      heading: {
        vi: 'Xông hơi. Tắm bồn. Xoa bóp toàn thân. Nghỉ ngơi.',
        en: 'Steam. Soak. Full-Body Massage. Rest.',
        cn: '蒸汽桑拿。泡浴。全身按摩。休息。',
        kr: '스팀. 욕조. 전신 마사지. 휴식.',
        jp: 'スチーム。バス。全身マッサージ。休息。',
      },
      paragraphs: [
        {
          vi: 'Một ngày tại Oria Farm Retreat không chỉ là đến gần thiên nhiên hơn. Đây còn là khoảng thời gian để cơ thể thực sự được chăm sóc.',
          en: 'A day at Oria Farm Retreat is not only about being closer to nature. It is also time dedicated to truly caring for your body.',
          cn: '在 Oria Farm Retreat 度过一天，不只是为了更靠近自然，也是为了真正花时间照顾自己的身体。',
          kr: 'Oria Farm Retreat에서의 하루는 자연과 가까워지는 것만을 의미하지 않습니다. 몸을 제대로 돌보는 시간이기도 합니다.',
          jp: 'Oria Farm Retreat で過ごす1日は、自然に近づくだけの時間ではありません。身体をきちんといたわるための時間でもあります。',
        },
        {
          vi: 'Bạn có thể bắt đầu bằng xông hơi, để hơi ấm bao quanh cơ thể và giúp mình dần rời khỏi sự căng thẳng và nhịp sống vội vàng thường ngày.',
          en: 'You may begin with a steam session, allowing the warmth to surround your body and gradually help you step away from the tension and pace of everyday life.',
          cn: '你可以从一次蒸汽桑拿开始，让温热慢慢包围身体，逐渐从日常的紧张与匆忙中抽离。',
          kr: '먼저 스팀 세션으로 시작해 따뜻한 온기가 몸을 감싸도록 두고, 일상의 긴장과 빠른 속도에서 천천히 벗어날 수 있습니다.',
          jp: 'まずはスチームから始めて、温かさに包まれながら、日常の緊張や慌ただしさから少しずつ離れていきます。',
        },
        {
          vi: 'Sau đó là khoảng thời gian tắm bồn nước ấm, nơi bạn có thể ngâm mình, chậm lại và tận hưởng sự riêng tư trong không gian yên tĩnh của retreat.',
          en: 'Then comes time for a warm bath, where you can soak, slow down, and enjoy the privacy of a peaceful retreat setting.',
          cn: '接下来，可以享受一段温水泡浴的时间，在宁静而私密的环境中慢下来，让身体进一步放松。',
          kr: '그다음에는 따뜻한 욕조 목욕을 즐기며 조용하고 프라이빗한 공간에서 몸을 담그고 천천히 긴장을 풀어봅니다.',
          jp: 'その後は温かいバスタイム。静かでプライベートな空間の中で湯につかり、身体も気持ちもゆっくりと落ち着かせます。',
        },
        {
          vi: 'Khi cơ thể đã thực sự thả lỏng, trải nghiệm tiếp tục với xoa bóp toàn thân.',
          en: 'Once the body has settled into a more relaxed state, the experience continues with a full-body massage.',
          cn: '当身体逐渐进入舒缓状态后，体验继续以全身按摩展开。',
          kr: '몸이 충분히 편안해지면 전신 마사지가 이어집니다.',
          jp: '身体が十分にゆるんだら、次は全身マッサージ。',
        },
        {
          vi: 'Những động tác xoa bóp, day ấn và chăm sóc cơ thể giúp giải tỏa cảm giác mệt mỏi tích tụ sau những ngày làm việc, ngồi lâu hoặc di chuyển nhiều.',
          en: 'Slow massage movements, pressure techniques, and attentive bodywork help release the fatigue that can build up from long working days, prolonged sitting, or frequent travel.',
          cn: '缓慢的按摩手法、适度的按压与细致的身体护理，有助于舒缓长期工作、久坐或频繁出行所积累的疲劳感。',
          kr: '천천히 이어지는 마사지 동작과 적절한 압, 세심한 바디 케어를 통해 오랜 업무, 장시간 앉아 있는 생활, 잦은 이동으로 쌓인 피로를 편안하게 풀어낼 수 있습니다.',
          jp: 'ゆっくりとした手技、心地よい圧、丁寧なボディケアによって、長時間の仕事や座りっぱなしの生活、移動などで蓄積した疲れをやわらげていきます。',
        },
        {
          vi: 'Không cần vội vàng đứng dậy ngay sau đó. Bạn có thể trở về bungalow, uống một tách trà, nằm nghỉ hoặc ngủ một giấc ngắn giữa thiên nhiên.',
          en: 'There is no need to get up immediately afterward. You can return to your bungalow, enjoy a cup of tea, lie down, or take a short nap surrounded by nature.',
          cn: '按摩结束后，也不需要马上起身。你可以回到自己的 bungalow，喝一杯茶、躺下来休息，或在自然环绕中小睡片刻。',
          kr: '마사지가 끝난 뒤에도 바로 일어날 필요는 없습니다. 방갈로로 돌아가 차를 마시거나, 편안히 눕거나, 자연 속에서 짧은 낮잠을 즐길 수 있습니다.',
          jp: 'マッサージが終わっても、すぐに立ち上がる必要はありません。バンガローに戻り、お茶を飲んだり、横になったり、自然の中で少し昼寝をしたりできます。',
        },
        {
          vi: 'Đó là một phần quan trọng trong trải nghiệm tại Oria: sau khi cơ thể được chăm sóc, bạn vẫn có đủ thời gian và không gian để tận hưởng trọn vẹn cảm giác thư giãn ấy.',
          en: 'This is an important part of the Oria experience: after your body has been cared for, you still have the time and space to fully enjoy that sense of relaxation.',
          cn: '这正是 Oria 体验中重要的一部分：身体得到照顾之后，你仍然拥有足够的时间和空间，让放松的感觉继续延伸。',
          kr: '이것이 Oria가 중요하게 생각하는 경험의 한 부분입니다. 몸을 돌본 뒤에도 그 편안함을 충분히 느낄 수 있도록 시간과 공간이 남아 있습니다.',
          jp: 'これも Oria で大切にしている体験のひとつです。身体をケアしたあとも、その心地よさを十分に味わうための時間と空間が残されています。',
        },
      ],
    },
    {
      id: 'sec-3',
      heading: {
        vi: 'Ăn chậm lại, tận hưởng thời gian của mình',
        en: 'Eat Slowly, Take Your Time',
        cn: '慢慢吃，慢慢享受这一天',
        kr: '천천히 먹고, 시간을 천천히 보내기',
        jp: 'ゆっくり食べて、ゆっくり過ごす',
      },
      paragraphs: [
        {
          vi: 'Một ngày nghỉ sẽ không trọn vẹn nếu mọi thứ vẫn phải diễn ra vội vàng.',
          en: 'A day of rest would not feel complete if everything still had to be rushed.',
          cn: '如果所有事情仍然匆匆进行，那么休息的一天也不会真正完整。',
          kr: '모든 것이 여전히 서둘러야 한다면 휴식의 하루도 완전하지 않습니다.',
          jp: '何もかも急いでいては、休息の1日も本当の意味では休みになりません。',
        },
        {
          vi: 'Tại Oria Farm Retreat, ăn uống đơn giản là một phần tự nhiên của ngày nghỉ.',
          en: 'At Oria Farm Retreat, eating is simply part of the day.',
          cn: '在 Oria Farm Retreat，吃东西只是这一天自然而简单的一部分。',
          kr: 'Oria Farm Retreat에서 먹는 것은 그날의 자연스러운 흐름 중 하나입니다.',
          jp: 'Oria Farm Retreat では、食べることもその日の自然な流れのひとつです。',
        },
        {
          vi: 'Bạn có thể thưởng thức đồ ăn giữa không gian xanh, dùng thêm đồ uống, trái cây hoặc trà trong bungalow và dành thời gian tận hưởng mà không phải vội chuyển sang hoạt động tiếp theo.',
          en: 'You can enjoy food surrounded by greenery, have drinks, fruit, or tea in your bungalow, and take your time without having to rush into the next activity.',
          cn: '你可以在绿意之间享用食物，也可以在 bungalow 里享用饮品、水果或茶，不需要赶着进入下一个安排。',
          kr: '푸른 자연 속에서 음식을 즐기고, 방갈로에서 음료와 과일, 차를 천천히 즐기며 다음 활동을 서둘러 준비하지 않아도 됩니다.',
          jp: '緑に囲まれて食事を楽しんだり、バンガローでドリンクやフルーツ、お茶を味わったり。次の予定を気にせず、ゆっくり時間を使うことができます。',
        },
        {
          vi: 'Đồ ăn, thiên nhiên, xông hơi, tắm bồn, xoa bóp toàn thân và nghỉ ngơi không phải những trải nghiệm tách biệt. Tất cả kết nối lại thành một ngày để cơ thể chậm lại và được chăm sóc từ đầu đến cuối.',
          en: 'Food, nature, steaming, bathing, full-body massage, and rest are not separate experiences. Together, they become a full day designed to help the body slow down and feel cared for from beginning to end.',
          cn: '食物、自然、蒸汽桑拿、泡浴、全身按摩与休息，并不是彼此分开的体验。它们共同组成完整的一天，让身体从开始到结束都能够慢下来，并被好好照顾。',
          kr: '음식, 자연, 스팀, 목욕, 전신 마사지, 휴식은 서로 따로 떨어진 경험이 아닙니다. 이 모든 것이 하나로 이어져 하루의 시작부터 끝까지 몸이 천천히 이완되고 돌봄을 받는 시간이 됩니다.',
          jp: '食事、自然、スチーム、入浴、全身マッサージ、休息は、それぞれ別々の体験ではありません。すべてがつながり、身体が1日の始まりから終わりまでゆっくりとほどけていく時間になります。',
        },
      ],
    },
    {
      id: 'sec-4',
      heading: {
        vi: 'Không cần đi thật xa để cảm thấy mình đã rời khỏi thành phố',
        en: 'You Do Not Have to Go Far to Feel Far Away',
        cn: '不必走得很远，也能真正离开城市',
        kr: '멀리 가지 않아도 도시를 벗어난 듯한 하루',
        jp: '遠くへ行かなくても、街を離れた気分になれる',
      },
      paragraphs: [
        {
          vi: 'Oria Farm Retreat dành cho những ngày bạn muốn tạm rời khỏi sự náo nhiệt nhưng không muốn chuẩn bị cho một chuyến du lịch dài ngày.',
          en: 'Oria Farm Retreat is for the days when you want to step away from the noise of the city without planning a complicated trip.',
          cn: 'Oria Farm Retreat 适合那些想暂时离开城市喧嚣，却不想安排复杂旅行的日子。',
          kr: 'Oria Farm Retreat는 도시의 소음에서 잠시 벗어나고 싶지만 복잡한 여행을 준비하고 싶지는 않은 날을 위한 공간입니다.',
          jp: 'Oria Farm Retreat は、都会の喧騒から少し離れたいけれど、大がかりな旅行の準備まではしたくない日に向いています。',
        },
        {
          vi: 'Một ngày cho hai người muốn có khoảng thời gian riêng.',
          en: 'A day for two people who want private time together.',
          cn: '可以是两个人想拥有一段安静而私密的时光。',
          kr: '둘만의 조용한 시간을 보내고 싶은 하루.',
          jp: 'ふたりで静かな時間を過ごしたい日。',
        },
        {
          vi: 'Một ngày để gia đình cùng ăn uống, nghỉ ngơi và gần thiên nhiên hơn.',
          en: 'A day for families to eat, rest, and enjoy nature together.',
          cn: '可以是家人一起吃东西、休息，与自然更靠近。',
          kr: '가족과 함께 먹고, 쉬고, 자연을 가까이 느끼고 싶은 하루.',
          jp: '家族で食事をし、休み、自然の中で過ごしたい日。',
        },
        {
          vi: 'Một ngày để bạn bè rời khỏi thành phố và tận hưởng thời gian bên nhau.',
          en: 'A day for friends to leave the city behind and spend meaningful time together.',
          cn: '可以是朋友暂时离开城市，一起度过轻松的一天。',
          kr: '친구들과 도시를 벗어나 편안한 시간을 보내고 싶은 하루.',
          jp: '友人と街を離れ、一緒にゆっくりしたい日。',
        },
        {
          vi: 'Hoặc đơn giản là một ngày chỉ dành cho chính mình.',
          en: 'Or simply a day entirely for yourself.',
          cn: '也可以，只是属于你自己的一天。',
          kr: '또는 오직 나 자신만을 위한 하루.',
          jp: 'あるいは、ただ自分のためだけに使う1日。',
        },
        {
          vi: 'Bạn đến vào ban ngày. Bạn bước vào một không gian xanh và yên tĩnh hơn. Bạn xông hơi. Bạn ngâm mình trong bồn nước ấm. Bạn để cơ thể được thả lỏng với xoa bóp toàn thân. Bạn ăn một bữa thật chậm. Bạn trở về bungalow và nghỉ giữa cây xanh. Và đến cuối ngày, bạn trở lại thành phố — nhưng với một nhịp hoàn toàn khác.',
          en: 'You arrive during the day. You step into a greener, quieter setting. You enjoy a steam session. You soak in a warm bath. You let your body unwind with a full-body massage. You eat slowly. You return to your bungalow and rest among the greenery. And by the end of the day, you return to the city — but at a completely different pace.',
          cn: '白天抵达。走进一片更绿、更安静的空间。蒸一次桑拿。泡进温暖的浴水里。让身体通过全身按摩慢慢放松。慢慢吃一顿饭。回到 bungalow，在绿意之间休息。到了傍晚，再回到城市 — 但此时的节奏已经完全不同。',
          kr: '낮에 도착합니다. 더 푸르고 조용한 공간으로 들어갑니다. 스팀을 즐깁니다. 따뜻한 욕조에 몸을 담급니다. 전신 마사지로 몸의 긴장을 천천히 풀어냅니다. 천천히 먹습니다. 방갈로로 돌아가 푸른 자연 속에서 쉽니다. 그리고 하루가 끝날 무렵 도시로 돌아갈 때에는, 내 안의 속도가 조금 달라져 있을 것입니다.',
          jp: '日中に到着する。より緑が多く、静かな場所へ入る。スチームを楽しむ。温かいお湯につかる。全身マッサージで身体をゆるめる。ゆっくり食べる。バンガローに戻り、緑の中で休む。そして1日の終わりに街へ戻る頃には、自分の中の時間の流れが少し変わっています。',
        },
      ],
    },
  ],
  highlights: {
    vi: ['Thiên nhiên', 'Xông hơi', 'Tắm bồn', 'Xoa bóp toàn thân', 'Ăn', 'Nghỉ'],
    en: ['Nature', 'Steam', 'Bath', 'Full-Body Massage', 'Eat', 'Rest'],
    cn: ['自然', '蒸汽桑拿', '泡浴', '全身按摩', '吃', '休息'],
    jp: ['自然', 'スチーム', 'バス', '全身マッサージ', '食べる', '休む'],
    kr: ['자연', '스팀', '욕조', '전신 마사지', '먹기', '휴식'],
  },
  closingText: {
    vi: 'Một ngày để tạm rời khỏi sự náo nhiệt của thành phố và dành cho cơ thể khoảng thời gian thực sự được nghỉ ngơi.',
    en: "A day to step away from the city's noise and give your body the time it truly needs to rest.",
    cn: '用一天暂时离开城市的喧嚣，让身体真正拥有休息的时间。',
    jp: '都会の喧騒から1日だけ離れ、身体に本当の休息を与える時間。',
    kr: '도시의 소음에서 하루 잠시 벗어나, 몸이 진정으로 쉴 수 있는 시간을 선물하세요.',
  },
  ctaText: {
    vi: 'Liên Hệ Đặt Chỗ Farm Retreat',
    en: 'Reserve Your Farm Retreat Day',
    cn: '预约 Farm Retreat 体验',
    jp: 'ファームリトリートを予約する',
    kr: '팜 리트릿 예약 문의하기',
  },
  ctaLink: '',
};

export function hydrateFarmRetreatConfig(raw: any): FarmRetreatConfig {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_FARM_RETREAT_CONFIG;
  }

  const rawSections = Array.isArray(raw.sections) && raw.sections.length > 0
    ? raw.sections
    : DEFAULT_FARM_RETREAT_CONFIG.sections;

  const hydratedSections: FarmRetreatSection[] = rawSections.map((sec: any, idx: number) => {
    const defaultSec = DEFAULT_FARM_RETREAT_CONFIG.sections[idx] || DEFAULT_FARM_RETREAT_CONFIG.sections[0];
    return {
      id: sec.id || defaultSec.id || `sec-${idx + 1}`,
      heading: sec.heading || defaultSec.heading,
      paragraphs: Array.isArray(sec.paragraphs) && sec.paragraphs.length > 0
        ? sec.paragraphs
        : defaultSec.paragraphs,
    };
  });

  const rawHero = typeof raw.heroImage === 'string' ? raw.heroImage.trim() : '';
  const heroImage = rawHero.includes('unsplash.com') ? '' : (rawHero || DEFAULT_FARM_RETREAT_CONFIG.heroImage || '');
  const isVideoDetect = /\.(mp4|mov|webm)(\?.*)?$/i.test(heroImage);
  const heroMediaType: 'image' | 'video' = raw.heroMediaType === 'video' || (raw.heroMediaType !== 'image' && isVideoDetect)
    ? 'video'
    : 'image';

  const rawPhotos: string[] = Array.isArray(raw.storyPhotos)
    ? raw.storyPhotos
    : (DEFAULT_FARM_RETREAT_CONFIG.storyPhotos || ['', '', '', '', '']);
  const storyPhotos = rawPhotos.map((url) =>
    typeof url === 'string' && !url.includes('unsplash.com') ? url.trim() : ''
  );

  return {
    pageTitle: raw.pageTitle || DEFAULT_FARM_RETREAT_CONFIG.pageTitle,
    pageSubtitle: raw.pageSubtitle || DEFAULT_FARM_RETREAT_CONFIG.pageSubtitle,
    heroImage,
    heroMediaType,
    heroWatermarkEnabled: raw.heroWatermarkEnabled !== false,
    introParagraphs: Array.isArray(raw.introParagraphs) && raw.introParagraphs.length > 0
      ? raw.introParagraphs
      : DEFAULT_FARM_RETREAT_CONFIG.introParagraphs,
    storyPhotos,
    storyPhotosWatermark: Array.isArray(raw.storyPhotosWatermark)
      ? raw.storyPhotosWatermark
      : [true, true, true, true, true],
    sections: hydratedSections,
    highlights: raw.highlights || DEFAULT_FARM_RETREAT_CONFIG.highlights,
    closingText: raw.closingText || DEFAULT_FARM_RETREAT_CONFIG.closingText,
    ctaText: raw.ctaText || DEFAULT_FARM_RETREAT_CONFIG.ctaText,
    ctaLink: raw.ctaLink || DEFAULT_FARM_RETREAT_CONFIG.ctaLink,
  };
}
