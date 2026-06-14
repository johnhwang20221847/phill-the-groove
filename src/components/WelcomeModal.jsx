import { useState } from 'react'

const slides = {
  en: [
    {
      icon: '🎵',
      tag: 'Welcome',
      title: 'Welcome to\nPhill the Groove',
      body: 'A participatory music community where music lovers share their favorite tracks and discover new ones. Explore picks dropped by fellow listeners — your next obsession might be one scroll away.',
    },
    {
      icon: '📻',
      tag: 'Feed',
      title: 'Explore the Feed',
      body: 'Browse real-time picks from other users on the LATEST PICKS feed. Sort by Latest, Title, Artist, or Genre — or use the search bar to find a specific song or artist instantly.',
    },
    {
      icon: '▶️',
      tag: 'Listen',
      title: 'Preview Any Track',
      body: 'See a ▶ Play button on a card? Tap it to open a Spotify preview right inside the feed — no redirects, no interruptions. Just music.',
    },
    {
      icon: '⭐',
      tag: 'Rate',
      title: 'Rate & React',
      body: 'Head to RATE SONGS to discover picks you haven\'t rated yet. Give each track a star rating — your reactions earn points for the recommender and shape the community Charts.',
    },
    {
      icon: '🏆',
      tag: 'Charts',
      title: 'Check the Charts',
      body: 'CHARTS shows the most reacted-to tracks in the community. Perfect for finding trending indie gems or hidden classics you might have missed.',
    },
    {
      icon: '🎤',
      tag: 'Drop a Pick',
      title: 'Drop Your Pick',
      body: 'Sign in and hit the red [+ DROP A PICK] button to share your own recommendation. Add a Spotify link so others can preview it right away. Build your reputation and climb the ranks!',
    },
  ],
  ko: [
    {
      icon: '🎵',
      tag: '환영합니다',
      title: 'Phill the Groove에\n오신 것을 환영합니다',
      body: '음악을 사랑하는 사람들이 자신만의 최애 곡을 추천하고, 새로운 음악을 함께 탐색하는 참여형 음악 커뮤니티입니다. 다른 리스너들의 픽을 탐색해보세요 — 다음 인생곡이 한 스크롤 앞에 있을지도 모릅니다.',
    },
    {
      icon: '📻',
      tag: '피드',
      title: '피드 탐색하기',
      body: 'LATEST PICKS 피드에서 다른 유저들이 실시간으로 추천한 곡들을 확인하세요. 최신순·제목순·아티스트순·장르순으로 정렬하거나, 검색창으로 원하는 곡과 아티스트를 바로 찾아보세요.',
    },
    {
      icon: '▶️',
      tag: '미리 듣기',
      title: '바로 들어보세요',
      body: '카드에 ▶ Play 버튼이 보이면 탭 하나로 피드 안에서 바로 Spotify 미리 듣기가 열립니다. 페이지 이동 없이, 끊김 없이, 그냥 음악만.',
    },
    {
      icon: '⭐',
      tag: '평가하기',
      title: '별점으로 반응 남기기',
      body: 'RATE SONGS에서 아직 평가하지 않은 곡들을 만나보세요. 별점을 남기면 추천자에게 점수가 쌓이고, 그 결과가 커뮤니티 차트에 반영됩니다.',
    },
    {
      icon: '🏆',
      tag: '차트',
      title: '차트 확인하기',
      body: 'CHARTS에서는 커뮤니티에서 가장 반응이 뜨거운 곡들을 한눈에 볼 수 있습니다. 트렌디한 인디 음악이나 숨은 명곡을 찾기에 딱입니다.',
    },
    {
      icon: '🎤',
      tag: '픽 올리기',
      title: '나만의 픽을 드롭하세요',
      body: '로그인 후 붉은색 [+ DROP A PICK] 버튼을 눌러 나만의 추천곡을 등록해보세요. Spotify 링크를 추가하면 다른 유저들이 바로 미리 들을 수 있어요. 추천을 쌓고 랭크를 올려보세요!',
    },
  ],
}

export default function WelcomeModal({ onClose }) {
  const [lang, setLang] = useState('en')
  const [current, setCurrent] = useState(0)
  const data = slides[lang]
  const slide = data[current]
  const isLast = current === data.length - 1

  function next() { if (!isLast) setCurrent(c => c + 1) }
  function prev() { if (current > 0) setCurrent(c => c - 1) }

  function switchLang(l) { setLang(l); setCurrent(0) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-groove-vinyl/70 backdrop-blur-sm px-4">
      <div className="bg-groove-cream w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-groove-vinyl via-groove-red to-groove-amber" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex gap-1">
            <button
              onClick={() => switchLang('en')}
              className={`font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 rounded transition-colors ${lang === 'en' ? 'bg-groove-vinyl text-groove-cream' : 'text-groove-label hover:text-groove-brown'}`}
            >EN</button>
            <button
              onClick={() => switchLang('ko')}
              className={`font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 rounded transition-colors ${lang === 'ko' ? 'bg-groove-vinyl text-groove-cream' : 'text-groove-label hover:text-groove-brown'}`}
            >KO</button>
          </div>
          <button onClick={onClose} className="text-groove-dust hover:text-groove-brown text-lg leading-none">✕</button>
        </div>

        {/* Slide */}
        <div className="px-6 py-4 min-h-[260px] flex flex-col justify-center">
          <div className="text-center mb-5">
            <div className="text-4xl mb-3">{slide.icon}</div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-groove-red mb-1">{slide.tag}</p>
            <h2 className="font-display font-black text-groove-vinyl text-2xl leading-tight whitespace-pre-line mb-3">
              {slide.title}
            </h2>
            <p className="font-body text-sm text-groove-brown leading-relaxed">{slide.body}</p>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 pb-3">
          {data.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${i === current ? 'w-4 h-1.5 bg-groove-vinyl' : 'w-1.5 h-1.5 bg-groove-dust'}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-2 px-5 pb-5">
          {current > 0 && (
            <button
              onClick={prev}
              className="flex-1 border border-groove-dust font-mono text-xs tracking-widest uppercase py-2.5 rounded hover:border-groove-brown hover:text-groove-brown transition-colors text-groove-label"
            >← Back</button>
          )}
          {!isLast ? (
            <button
              onClick={next}
              className="flex-1 bg-groove-vinyl text-groove-cream font-mono text-xs tracking-widest uppercase py-2.5 rounded hover:bg-groove-brown transition-colors"
            >Next →</button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 bg-groove-red text-groove-cream font-mono text-xs tracking-widest uppercase py-2.5 rounded hover:bg-groove-brown transition-colors"
            >🎵 Start Exploring</button>
          )}
        </div>
      </div>
    </div>
  )
}
