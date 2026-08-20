import React, { useState, useEffect, useRef } from 'react';
import styles from './AskOriaAnswer.module.css';

interface Place {
  name: string;
  type: string;
  map: string;
  headline: string;
  desc: string;
  tags: string[];
  why: string;
  image?: string;
}

interface Mood {
  key: string;
  btn_text: string;
  title: string;
  text: string;
  place: string;
  link: string;
  image?: string;
}

interface AnswerData {
  eyebrow: string;
  headline: string;
  lead: string;
  places: Place[];
  moods: Mood[];
}

export const blogsData: Record<string, AnswerData> = {
  'Quanh Oria Spa': {
    eyebrow: 'ORIA ANSWER · NEIGHBORHOOD · WALKING DISTANCE',
    headline: 'Dạo bước quanh Oria.',
    lead: 'Đôi khi, lịch trình tốt nhất là không cần lịch trình nào cả. Chỉ vài bước tản bộ từ Oria Spa, bạn đã có thể tận hưởng một bữa tối đậm vị Việt hay một ly bia thủ công mát lạnh.',
    places: [
      {
        name: 'VIETNAMESE HOUSE', type: 'Traditional Vietnamese', map: 'https://maps.app.goo.gl/VietnameseHouse',
        headline: 'Ẩm thực Việt trong không gian gỗ cổ truyền.',
        desc: 'Nhà hàng mang đậm phong cách truyền thống, phục vụ những món Việt tinh tế trong không gian sang trọng, ấm cúng. Nằm ngay sát Oria, rất tiện lợi cho bữa tối nhẹ nhàng.',
        tags: ['Vietnamese', 'Walking distance', 'Elegant'],
        why: 'Tiện lợi tuyệt đối sau một buổi massage, không gian hoàn hảo cho một bữa ăn chuẩn Việt Nam nhưng chỉn chu.',
        image: 'https://images.unsplash.com/photo-1554679665-f5537f187268?q=80&w=2800&auto=format&fit=crop'
      },
      {
        name: 'HOÀNG YẾN', type: 'Vietnamese Cuisine', map: 'https://maps.app.goo.gl/HoangYen',
        headline: 'Menu đa dạng mọi hương vị Bắc Trung Nam.',
        desc: 'Chỉ cách một vách tường. Hoàng Yến mang đến mâm cơm gia đình chuẩn vị Bắc - Trung - Nam, lý tưởng cho những ai muốn một bữa ăn trọn vẹn mà không cần di chuyển xa.',
        tags: ['Next door', 'Convenient', 'Varied menu'],
        why: 'Lựa chọn an toàn và cực kỳ gần. Phù hợp khi bạn đang đói và không muốn suy nghĩ nhiều về việc đi lại.',
        image: 'https://images.unsplash.com/photo-1502301103665-0b95cc738daf?q=80&w=2800&auto=format&fit=crop'
      },
      {
        name: 'PASTEUR STREET BREWING', type: 'Craft Beer', map: 'https://maps.app.goo.gl/PasteurStreet',
        headline: 'Ly bia thủ công mát lạnh ngay đối diện.',
        desc: 'Ngay phía đối diện. Tiên phong về bia thủ công tại Việt Nam, kết hợp kỹ thuật ủ bia phương Tây cùng những nguyên liệu địa phương độc đáo như hoa nhài, chanh dây hay cacao.',
        tags: ['Craft Beer', 'Opposite Oria', 'Chill'],
        why: 'Một ly Jasmine IPA thơm nhẹ mùi hoa nhài là cách hoàn hảo để kéo dài cảm giác thư giãn sau buổi spa.',
        image: 'https://images.unsplash.com/photo-1563514995383-a7c8ea4a362e?q=80&w=2800&auto=format&fit=crop'
      }
    ],
    moods: [
      { key: 'traditional', btn_text: 'Thích không gian truyền thống', title: 'Vietnamese House — Bản sắc Việt Nam.', text: 'Không gian nhà gỗ sang trọng, thích hợp cho một bữa ăn chỉn chu và yên tĩnh ngay sau khi thư giãn tại Spa.', place: 'VIETNAMESE HOUSE', link: 'https://maps.app.goo.gl/VietnameseHouse', image: 'https://images.unsplash.com/photo-1554679665-f5537f187268?q=80&w=2800&auto=format&fit=crop' },
      { key: 'convenience', btn_text: 'Cần sự tiện lợi tuyệt đối', title: 'Hoàng Yến — Vài bước chân là tới.', text: 'Khi bạn chỉ muốn bước ra khỏi spa và có ngay một bàn ăn thịnh soạn với đủ mọi món Việt.', place: 'HOÀNG YẾN', link: 'https://maps.app.goo.gl/HoangYen', image: 'https://images.unsplash.com/photo-1502301103665-0b95cc738daf?q=80&w=2800&auto=format&fit=crop' },
      { key: 'refresh', btn_text: 'Thèm một chút cồn mát lạnh', title: 'Pasteur Street Brewing — Giải nhiệt tức thì.', text: 'Bước sang kia đường, gọi ngay một ly Craft Beer vị hoa nhài để lấy lại năng lượng và tận hưởng khí trời Sài Gòn.', place: 'PASTEUR STREET BREWING', link: 'https://maps.app.goo.gl/PasteurStreet', image: 'https://images.unsplash.com/photo-1563514995383-a7c8ea4a362e?q=80&w=2800&auto=format&fit=crop' }
    ]
  },
  'Ăn tối ở Quận 1': {
    eyebrow: 'ORIA ANSWER · DISTRICT 1 · TONIGHT',
    headline: 'Nếu đã ở Quận 1,\nđừng ăn một bữa tối quá bình thường.',
    lead: 'Oria chọn <strong>những nơi có một lý do để nhớ</strong> — vì món ăn, không gian hoặc cách họ kể lại Sài Gòn. Không phải danh sách “top restaurants”, mà là ba trải nghiệm thật sự khác nhau.',
    places: [
      {
        name: 'ANAN SAIGON', type: 'Modern Vietnamese', map: 'https://www.google.com/maps/search/?api=1&query=Anan+Saigon+89+Ton+That+Dam',
        headline: 'Món Việt, nhưng không theo cách bạn đoán.',
        desc: 'Một lựa chọn hợp khi bạn muốn bữa tối có tính khám phá hơn là chỉ “ăn ngon”. Concept Việt đương đại khiến những thứ quen thuộc trở thành một trải nghiệm khác hẳn.',
        tags: ['Unexpected', 'Modern Vietnamese', 'Conversation starter'],
        why: 'Vì đây là kiểu nơi khiến bạn có chuyện để nói tiếp sau khi món cuối đã dọn khỏi bàn.',
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2800&auto=format&fit=crop'
      },
      {
        name: 'THE MONKEY GALLERY', type: 'Creative dining', map: 'https://www.google.com/maps/search/?api=1&query=The+Monkey+Gallery+Dining+91+Mac+Thi+Buoi',
        headline: 'Khi bữa tối trở thành một trải nghiệm sáng tạo.',
        desc: 'Dành cho tối bạn muốn chủ động chọn một trải nghiệm khác thường. Không phải ghé vào ăn nhanh — đây là nơi phù hợp khi chính bữa tối là hoạt động chính của buổi tối.',
        tags: ['Creative', 'Dinner as experience', 'Special night'],
        why: 'Chọn nơi này khi bạn không cần “đi đâu tiếp theo” — vì dinner đã đủ để trở thành điểm nhấn.',
        image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=2800&auto=format&fit=crop'
      },
      {
        name: 'THE TRIỆU INSTITUTE', type: 'Contemporary Vietnamese + cocktails', map: 'https://www.google.com/maps/search/?api=1&query=The+Trieu+Institute+10+Mac+Thi+Buoi',
        headline: 'Ăn tối xong nhưng chưa cần kết thúc tối nay.',
        desc: 'Một lựa chọn có nhịp chuyển tự nhiên từ dinner sang cocktail. Hợp nếu bạn muốn một nơi vừa đủ chỉn chu nhưng vẫn giữ cảm giác thành phố về đêm.',
        tags: ['Dinner + drinks', 'Contemporary', 'Night continues'],
        why: 'Không cần đổi địa điểm ngay sau dinner. Tối có thể tự kéo dài thêm một nhịp.',
        image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2800&auto=format&fit=crop'
      }
    ],
    moods: [
      { key: 'surprise', btn_text: 'Muốn bị bất ngờ', title: 'Anan Saigon — bắt đầu bằng sự tò mò.', text: 'Nếu điều bạn muốn là một chút bất ngờ, chọn nơi có khả năng làm thứ quen thuộc trở nên khác đi.', place: 'ANAN SAIGON · TÔN THẤT ĐẠM', link: 'https://www.google.com/maps/search/?api=1&query=Anan+Saigon+89+Ton+That+Dam', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2800&auto=format&fit=crop' },
      { key: 'experience', btn_text: 'Muốn dinner là highlight', title: 'The Monkey Gallery DINING — để dinner tự trở thành kế hoạch.', text: 'Không cần cố nhét thêm café, bar hay điểm check-in sau đó. Khi bạn muốn chính bữa tối là highlight, đây là hướng có tính trải nghiệm mạnh nhất trong ba lựa chọn.', place: 'THE MONKEY GALLERY DINING · MẠC THỊ BƯỞI', link: 'https://www.google.com/maps/search/?api=1&query=The+Monkey+Gallery+Dining+91+Mac+Thi+Buoi', image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=2800&auto=format&fit=crop' },
      { key: 'night', btn_text: 'Muốn tối kéo dài thêm', title: 'The Triệu Institute — đừng kết thúc tối quá sớm.', text: 'Dinner có thể trôi thẳng sang cocktail mà không cần đổi mood hoặc chạy sang một địa điểm mới.', place: 'THE TRIỆU INSTITUTE · MẠC THỊ BƯỞI', link: 'https://www.google.com/maps/search/?api=1&query=The+Trieu+Institute+10+Mac+Thi+Buoi', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2800&auto=format&fit=crop' },
      { key: 'story', btn_text: 'Muốn một nơi có chuyện để kể', title: 'Anan Saigon — nơi đáng để kể lại.', text: 'Nếu một địa điểm phải có nhiều hơn \'đồ ăn ngon\', hãy chọn nơi có một cách nhìn riêng về món Việt và thành phố.', place: 'ANAN SAIGON · TÔN THẤT ĐẠM', link: 'https://www.google.com/maps/search/?api=1&query=Anan+Saigon+89+Ton+That+Dam', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2800&auto=format&fit=crop' },
      { key: 'after9', btn_text: 'Bắt đầu sau 9PM', title: 'The Triệu Institute — hợp nhịp tối muộn hơn.', text: 'Nếu bắt đầu sau 9PM, Oria ưu tiên một nơi mà dinner và phần còn lại của đêm có thể nối nhau tự nhiên.', place: 'THE TRIỆU INSTITUTE · MẠC THỊ BƯỞI', link: 'https://www.google.com/maps/search/?api=1&query=The+Trieu+Institute+10+Mac+Thi+Buoi', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2800&auto=format&fit=crop' },
      { key: 'friends', btn_text: 'Đi cùng người thú vị', title: 'Anan Saigon — vì bữa tối nên tạo conversation.', text: 'Đi cùng một người thú vị thì nơi ăn cũng nên có thứ để bàn luận. Một concept có góc nhìn riêng sẽ tạo ra nhiều conversation hơn.', place: 'ANAN SAIGON · TÔN THẤT ĐẠM', link: 'https://www.google.com/maps/search/?api=1&query=Anan+Saigon+89+Ton+That+Dam', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2800&auto=format&fit=crop' },
    ]
  },
  'Một buổi chiều yên tĩnh': {
    eyebrow: 'ORIA ANSWER · DISTRICT 1 · AFTERNOON',
    headline: 'Khi bạn cần một góc để trốn khỏi nhịp đập ồn ào của Sài Gòn.',
    lead: 'Oria chọn <strong>những nơi có khoảng lặng</strong> — vì âm nhạc, không gian hoặc cách họ trân trọng sự yên bình. Không phải quán cà phê ồn ào để làm việc, mà là ba chốn ẩn náu thực sự.',
    places: [
      { name: 'PADMA DE FLEUR', type: 'Floral Cafe', map: 'https://maps.app.goo.gl/PadmaDeFleur', headline: 'Nơi hoa cỏ kể chuyện và thời gian trôi chậm lại.', desc: 'Một không gian nhỏ nhắn ẩn mình trong hẻm, nơi bạn được bao quanh bởi hoa tươi, mùi hương dịu nhẹ và một ly trà êm ái.', tags: ['Hidden gem', 'Floral', 'Slow living'], why: 'Vì sự mộc mạc và tĩnh lặng hiếm hoi, nơi bạn có thể ngắt kết nối thực sự.', image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2800&auto=format&fit=crop' },
      { name: 'OKKIO CAFFE (LÊ LỢI)', type: 'Specialty Coffee', map: 'https://maps.app.goo.gl/Okkio', headline: 'Góc nhìn trên cao ngắm phố thị nhưng vẫn tĩnh tại.', desc: 'Nép mình trên lầu cũ, không gian màu đỏ gạch cổ điển, âm nhạc vừa đủ nhỏ để đọc sách hoặc suy nghĩ một mình.', tags: ['Specialty Coffee', 'Vintage', 'Focus'], why: 'Ánh sáng tự nhiên tuyệt đẹp và cà phê chất lượng cao cho một buổi chiều cần sự tập trung.', image: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?q=80&w=2800&auto=format&fit=crop' },
      { name: 'THE LIBRARY', type: 'Luxury Lounge', map: 'https://maps.app.goo.gl/ParkHyatt', headline: 'Sự tĩnh lặng sang trọng và dịch vụ hoàn hảo.', desc: 'Không gian ngập tràn sách, thảm êm ái, tách trà chiều chuẩn mực. Nơi tuyệt đối không ai làm phiền bạn.', tags: ['Luxury', 'Afternoon Tea', 'Private'], why: 'Dành cho những buổi chiều bạn muốn nuông chiều bản thân bằng sự yên tĩnh đẳng cấp nhất.', image: 'https://images.unsplash.com/photo-1542181961-9590d0c79218?q=80&w=2800&auto=format&fit=crop' }
    ],
    moods: [
      { key: 'focus', btn_text: 'Muốn tập trung đọc sách', title: 'Okkio Caffe — Nơi tâm trí được tĩnh lặng.', text: 'Với ánh sáng dịu nhẹ và tiếng nhạc vừa đủ, đây là nơi tốt nhất để lật mở một quyển sách.', place: 'OKKIO CAFFE · LÊ LỢI', link: 'https://maps.app.goo.gl/Okkio', image: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?q=80&w=2800&auto=format&fit=crop' },
      { key: 'nature', btn_text: 'Thích gần gũi cỏ cây', title: 'Padma de Fleur — Lạc vào khu vườn nhỏ.', text: 'Không gian tràn ngập hoa lá giúp tâm hồn bạn được xoa dịu hoàn toàn.', place: 'PADMA DE FLEUR', link: 'https://maps.app.goo.gl/PadmaDeFleur', image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2800&auto=format&fit=crop' },
      { key: 'luxury', btn_text: 'Muốn thư giãn sang trọng', title: 'The Library — Trải nghiệm hoàng gia thu nhỏ.', text: 'Thưởng thức set trà chiều trong sự im lặng tuyệt đối của một trong những lounge sang trọng nhất Sài Gòn.', place: 'THE LIBRARY · PARK HYATT', link: 'https://maps.app.goo.gl/ParkHyatt', image: 'https://images.unsplash.com/photo-1542181961-9590d0c79218?q=80&w=2800&auto=format&fit=crop' }
    ]
  },
  'Đi đâu sau 9PM': {
    eyebrow: 'ORIA ANSWER · DISTRICT 1 · LATE NIGHT',
    headline: 'Sài Gòn sau 9PM không chỉ có những tụ điểm ồn ào.',
    lead: 'Oria chọn <strong>những không gian sâu lắng</strong> — vì ly cocktail, dòng nhạc Jazz hoặc cảm giác thân mật. Không phải club xập xình, mà là những nơi màn đêm thật sự có chiều sâu.',
    places: [
      { name: 'FIRKIN BAR', type: 'Bespoke Whiskey', map: 'https://maps.app.goo.gl/Firkin', headline: 'Nơi bạn được lắng nghe để pha một ly rượu dành riêng cho mình.', desc: 'Một speakeasy bar cổ điển, ánh sáng tối, âm nhạc trầm mặc và những bartender cực kỳ am hiểu về Whiskey.', tags: ['Bespoke', 'Whiskey', 'Intimate'], why: 'Vì đây là nơi bạn có thể trò chuyện sâu sắc hoặc ngồi một mình thư giãn hoàn toàn.', image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=2800&auto=format&fit=crop' },
      { name: 'THE ALLEY COCKTAIL', type: 'Hidden Bar', map: 'https://maps.app.goo.gl/TheAlley', headline: 'Rượu ngon và bánh ngọt trong hẻm sâu.', desc: 'Sự kết hợp bất ngờ giữa cocktail đậm vị và macaron ngọt ngào. Không gian ấm cúng, tách biệt hoàn toàn khỏi đường phố.', tags: ['Hidden Alley', 'Cocktail', 'Cozy'], why: 'Một chút ngọt ngào cho buổi tối muộn sẽ làm mềm mại lại mọi mệt mỏi trong ngày.', image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=2800&auto=format&fit=crop' },
      { name: 'RABBIT HOLE', type: 'Underground Speakeasy', map: 'https://maps.app.goo.gl/RabbitHole', headline: 'Trốn xuống lòng đất để nghe Jazz.', desc: 'Cảm hứng từ những quán bar ngầm ở Mỹ thập niên 20, nơi âm nhạc Jazz sống động hòa quyện với những ly cocktail cổ điển.', tags: ['Live Jazz', 'Underground', 'Classic'], why: 'Nhạc Jazz sống là thứ gia vị tuyệt hảo nhất để kết thúc một buổi tối ở Sài Gòn.', image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2800&auto=format&fit=crop' }
    ],
    moods: [
      { key: 'chat', btn_text: 'Muốn trò chuyện sâu sắc', title: 'Firkin Bar — Góc khuất tĩnh lặng.', text: 'Sự im lặng đắt giá cùng những ly Whiskey được pha chế riêng sẽ mở ra những cuộc trò chuyện chất lượng.', place: 'FIRKIN BAR', link: 'https://maps.app.goo.gl/Firkin', image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=2800&auto=format&fit=crop' },
      { key: 'music', btn_text: 'Muốn nghe nhạc Jazz', title: 'Rabbit Hole — Chuyến tàu về thập niên 20.', text: 'Nhạc Jazz live chơi nhẹ nhàng sẽ mang lại cảm giác thư thái tột cùng sau một ngày dài.', place: 'RABBIT HOLE', link: 'https://maps.app.goo.gl/RabbitHole', image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2800&auto=format&fit=crop' },
      { key: 'sweet', btn_text: 'Thích một chút ngọt ngào', title: 'The Alley — Nơi nỗi buồn tan chảy.', text: 'Nếm thử một chiếc bánh macaron ngọt ngào đi kèm ly cocktail thanh mát.', place: 'THE ALLEY COCKTAIL BAR', link: 'https://maps.app.goo.gl/TheAlley', image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=2800&auto=format&fit=crop' }
    ]
  },
  'Local, không touristy': {
    eyebrow: 'ORIA ANSWER · DISTRICT 1 · LOCAL VIBE',
    headline: 'Khám phá một Sài Gòn ẩn giấu, xa khỏi lớp vỏ hào nhoáng.',
    lead: 'Oria chọn <strong>những chốn lui tới của người bản địa</strong> — vì hương vị, văn hóa hẻm hoặc sự dung dị chân thực. Không phải những điểm đánh giá 5 sao trên Tripadvisor, mà là Sài Gòn của người Sài Gòn.',
    places: [
      { name: 'NHAU NHAU', type: 'Retro Vietnamese Bar', map: 'https://maps.app.goo.gl/NhauNhau', headline: 'Văn hóa nhậu Sài Gòn được nâng tầm tinh tế.', desc: 'Ngồi quanh quầy bar chữ U, nghe nhạc xưa, uống cocktail vị phở hay bia thủ công và ăn những món nhậu Việt Nam thân thuộc.', tags: ['Retro', 'Vietnamese Bar', 'Nostalgic'], why: 'Bắt trọn cái hồn "nhậu" của người Việt nhưng trong một không gian văn minh, không ồn ào xô bồ.', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=2800&auto=format&fit=crop' },
      { name: 'CỤC GẠCH QUÁN', type: 'Homestyle Vietnamese', map: 'https://maps.app.goo.gl/CucGach', headline: 'Bữa cơm nhà giản dị trong không gian kiến trúc độc bản.', desc: 'Nằm trong một căn biệt thự cũ, phục vụ những món ăn đậm chất gia đình Việt Nam trên nền bát đĩa gốm mộc mạc.', tags: ['Homestyle', 'Architecture', 'Comfort Food'], why: 'Cảm giác như được dùng bữa tại nhà một người bạn Việt Nam có gu thẩm mỹ cao.', image: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?q=80&w=2800&auto=format&fit=crop' },
      { name: 'CÀ PHÊ VỢT CHEO LEO', type: 'Historic Cafe', map: 'https://maps.app.goo.gl/CheoLeo', headline: 'Hương vị của Sài Gòn từ hơn nửa thế kỷ trước.', desc: 'Nằm sâu trong hẻm, quán cà phê vợt bằng siêu đất nung hiếm hoi còn sót lại, nơi di sản và văn hóa hẻm vẫn đang sống mỗi ngày.', tags: ['Historic', 'Alley Culture', 'Authentic'], why: 'Trải nghiệm văn hóa hẻm Sài Gòn thực sự, không thể tìm thấy ở các tiệm cà phê hiện đại.', image: 'https://images.unsplash.com/photo-1510211116244-1296ee97baac?q=80&w=2800&auto=format&fit=crop' }
    ],
    moods: [
      { key: 'drink', btn_text: 'Thích không khí nhậu retro', title: 'Nhau Nhau — Một thoáng hoài niệm.', text: 'Vừa đủ nhộn nhịp để vui, nhưng vẫn đủ tinh tế để hoài niệm về Sài Gòn xưa.', place: 'NHAU NHAU', link: 'https://maps.app.goo.gl/NhauNhau', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=2800&auto=format&fit=crop' },
      { key: 'food', btn_text: 'Muốn ăn bữa cơm nhà', title: 'Cục Gạch Quán — Nơi trở về nhà.', text: 'Thưởng thức mâm cơm chuẩn Việt Nam trong một không gian thô mộc và thân mật.', place: 'CỤC GẠCH QUÁN', link: 'https://maps.app.goo.gl/CucGach', image: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?q=80&w=2800&auto=format&fit=crop' },
      { key: 'coffee', btn_text: 'Tìm kiếm di sản văn hóa', title: 'Cheo Leo — Giọt cà phê thời gian.', text: 'Cảm nhận nhịp sống chậm rãi và những câu chuyện Sài Gòn xưa bên ly cà phê vợt bốc khói.', place: 'CÀ PHÊ VỢT CHEO LEO', link: 'https://maps.app.goo.gl/CheoLeo', image: 'https://images.unsplash.com/photo-1510211116244-1296ee97baac?q=80&w=2800&auto=format&fit=crop' }
    ]
  }
};

export default function AskOriaAnswer({ topic, onBack }: { topic: string, onBack: () => void }) {
  const data = blogsData[topic];
  const [activeMood, setActiveMood] = useState<Mood | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset mood when topic changes, and scroll to top of section
  useEffect(() => {
    if (data && data.moods.length > 0) {
      setActiveMood(data.moods[0]);
    }
    if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [topic, data]);

  if (!data) return null;

  return (
    <section className={styles.answer} ref={containerRef}>
      <button className={styles.backButton} onClick={onBack}>
        ← Trở lại danh sách
      </button>
      <div className={styles.eyebrow}>{data.eyebrow}</div>
      <h1 dangerouslySetInnerHTML={{ __html: data.headline.replace('\n', '<br/>') }} />
      <p className={styles.lead} dangerouslySetInnerHTML={{ __html: data.lead }} />

      <div className={styles.rule}></div>

      {data.places.map((place, index) => (
        <article key={index} className={styles.placeCard}>
          <div className={styles.num}>0{index + 1}</div>
          <div>
            {/* Image Placeholder */}
            <div className={styles.imagePlaceholder}>
              {place.image ? <img src={place.image} alt={place.name} /> : 'Image Placeholder (16:9)'}
            </div>

            <div className={styles.placeMeta}>
              <span>{place.name}</span><span className={styles.dot}>·</span><span>{place.type}</span>
              <a className={styles.google} target="_blank" href={place.map} rel="noreferrer">
                Google Maps ↗
              </a>
            </div>
            <h2>{place.headline}</h2>
            <p>{place.desc}</p>
            <div className={styles.tags}>
              {place.tags.map((t, i) => <span key={i} className={styles.tag}>{t}</span>)}
            </div>
          </div>
          <aside className={styles.why}>
            <span>WHY ORIA PICKED IT</span>
            {place.why}
          </aside>
        </article>
      ))}

      <section className={styles.horizontalChoice}>
        <div>
          <div className={styles.choiceTitle}>
            <div className={styles.mini}>LET ORIA CHOOSE</div>
            <h3>Bạn muốn trải nghiệm cảm giác gì?</h3>
            <p className={styles.choiceExplain}>
              Chọn một ưu tiên. Oria sẽ không đưa thêm danh sách — chỉ chọn lại hướng phù hợp nhất.
            </p>
          </div>

          <div className={styles.horizontalMoods}>
            {data.moods.map(mood => (
              <button 
                key={mood.key} 
                className={`${styles.mood} ${activeMood?.key === mood.key ? styles.active : ''}`}
                onClick={() => setActiveMood(mood)}
              >
                <span className={styles.name}>{mood.btn_text}</span>
                <span className={styles.arrow}>→</span>
              </button>
            ))}
          </div>
        </div>

        <aside className={styles.horizontalPick}>
          {activeMood && (
            <a className={styles.attachedMapLink} target="_blank" href={activeMood.link} rel="noreferrer">
              Mở trên Google Maps ↗
            </a>
          )}
          
          <div>
            <div className={styles.pickLabel}>ORIA WOULD TAKE YOU HERE</div>
            {activeMood && (
              <>
                <h4>{activeMood.title}</h4>
                <p>{activeMood.text}</p>
              </>
            )}
          </div>

          <div>
            {/* Pick Image Placeholder */}
            {activeMood && (
              <div className={styles.pickImagePlaceholder}>
                {activeMood.image ? <img src={activeMood.image} alt="Pick" /> : 'Context Image Placeholder'}
              </div>
            )}
            <div className={styles.pickPlaceOnly}>
              <div className={styles.placeName}>{activeMood?.place}</div>
            </div>
          </div>
        </aside>
      </section>
    </section>
  );
}
