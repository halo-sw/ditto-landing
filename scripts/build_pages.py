#!/usr/bin/env python3
"""하위 페이지 만들기: /platter/ /ditto/ /frequency/ /play/ /story/
문구를 고친 뒤 다시 돌린다.  python3 scripts/build_pages.py
이미지 자리는 ph(번호, 설명, 비율)로 둔다. 에셋이 오면 같은 비율의 <img>로 바꾼다."""
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
APP = 'https://apps.apple.com/kr/app/id6824991758'
PAGES = [('platter', '플래터'), ('ditto', '디토'), ('frequency', '주파수'), ('play', '놀이'), ('story', '이야기')]
import re as _re
APL = _re.search(r'<svg width="0" height="0"[^>]*>.*?</svg>', (ROOT / 'index.html').read_text(encoding='utf-8'), _re.S).group(0)
T = ['#E7DBFD', '#ECEAF0', '#CFF6EC', '#DCDDF7', '#F6DCEF']
_n = [20]
def ph(desc, ratio, tint='', cls='', style=''):
    _n[0] += 1
    st = ('--t:%s;' % tint if tint else '') + style
    return '<figure class="ph%s" data-n="%d"%s><figcaption><span>%s</span><i>%s</i></figcaption></figure>' % (' ' + cls if cls else '', _n[0], ' style="%s"' % st if st else '', desc, ratio)
def head(title, big, sub=''):
    return '<div class="wrap k-st"><h2>%s</h2>%s</div>' % (big, '<p>%s</p>' % sub if sub else '')
def intro(text): return '<div class="wrap k-lead"><p class="k-intro-t">%s</p></div>' % text
def sec(i, name, body, cls='k-ch sec'): return '<section class="%s" id="s%d" data-tk="%s">\n%s\n</section>' % (cls, i, name, body)
def cards(items, n=3, label='원칙'):
    return '<div class="wrap"><ul class="pc" style="--n:%d">%s</ul></div>' % (n, ''.join('<li><small>%s %02d</small><b>%s</b><p>%s</p></li>' % (label, k + 1, a, b) for k, (a, b) in enumerate(items)))
def steps(items):
    return '<div class="wrap"><ol class="tl">%s</ol></div>' % ''.join('<li><i>%02d</i><b>%s</b><p>%s</p></li>' % (k + 1, a, b) for k, (a, b) in enumerate(items))
def pin(pid, names, lines, descs, tints):
    return ('<div class="k-pin" id="kPin" data-i="0" data-names="%s"><div class="k-pin-st"><div class="wrap k-pin-in"><div class="k-pin-l"><p class="k-lab"><span id="kPinN">%s</span></p>%s</div><div class="k-sq">%s</div></div></div></div>'
            % ('|'.join(names), names[0], ''.join('<p class="k-ln">%s</p>' % l for l in lines), ''.join(ph(d, '1:1', t, 'ph-w' if t == '#4A4BC0' else '') for d, t in zip(descs, tints))))
def sl(big_, sub, items, label='약속'):
    pal = [('#E7DBFD', '#6A1FC2'), ('#07E7B4', '#06382E'), ('#4A4BC0', '#E3E4FF'), ('#FFCADF', '#C4186A')]
    cs = ''.join('<li style="--bg:%s;--fg:%s"><small>%s %02d</small><b>%s</b><p>%s</p></li>' % (pal[k % 4][0], pal[k % 4][1], label, k + 1, a, b) for k, (a, b) in enumerate(items))
    return '<div class="wrap sl"><div class="sl-l"><h2>%s</h2><p>%s</p></div><ul class="sl-r">%s</ul></div>' % (big_, sub, cs)
def flip(items):
    return '<div class="wrap"><ul class="fc">%s</ul><p class="fc-h">카드를 누르면 뒤집혀요</p></div>' % ''.join('<li><button type="button" aria-pressed="%s"><span class="fc-in"><span class="fc-f"><i>%02d</i><b>%s</b></span><span class="fc-b"><b>%s</b><em>%s</em></span></span></button></li>' % ('true' if k % 2 else 'false', k + 1, a, a, b) for k, (a, b) in enumerate(items))
def qa(items):
    return '<div class="wrap"><ul class="qc">%s</ul></div>' % ''.join('<li tabindex="0"><small>Q%d</small><b>%s</b><div class="qc-a"><p>%s</p></div></li>' % (k + 1, a, b) for k, (a, b) in enumerate(items))
def chips(rows):
    pal = [('#E7DBFD', '#6A1FC2'), ('#07E7B4', '#06382E'), ('#4A4BC0', '#fff'), ('#FFCADF', '#C4186A'), ('#16121B', '#fff'), ('#F4F3F6', '#16121B')]
    out = ''
    for r, row in enumerate(rows):
        one = ''.join('<span style="--bg:%s;--fg:%s">%s</span>' % (pal[(k + r * 2) % 6][0], pal[(k + r * 2) % 6][1], x) for k, x in enumerate(row))
        out += '<div class="cm-r"><div class="cm-t %s">%s</div></div>' % ('l' if r % 2 == 0 else 'r', one * 4)
    return '<div class="cm" aria-hidden="true">%s</div>' % out
def fb(desc): return '<div class="fbl">%s</div>' % ph(desc + ' · 화면 가득', '16:9', '', 'ph-d')
def dark(text, small=''):
    lines = text.split('<br>')
    return '<section class="db"><div class="db-st"><p>%s%s</p></div></section>' % (''.join('<span>%s</span>' % l for l in lines), '<small>%s</small>' % small if small else '')
def big(word, bg, fg='#16121B'): return '<div class="wrap"><div class="bw" style="--bg:%s;--fg:%s"><b>%s</b></div></div>' % (bg, fg, word)

HOLD = '''<div class="wrap"><div class="hd" id="hd" data-n="12">
  <button type="button" class="hd-b" id="hdB" aria-label="3초 동안 꾹 눌러 디토하기"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54"/><circle class="hd-r" cx="60" cy="60" r="54" pathLength="1"/></svg><span id="hdN">꾹</span></button>
  <p class="hd-h" id="hdH" aria-live="polite">원을 3초 동안 눌러 보세요</p>
  <p class="hd-c"><span>인터랙션 12 · 친구의 조각이 내 플래터로 옮겨 오는 장면</span><i>16:9</i></p>
</div></div>'''
FREQ = '''<section class="fq-w" id="n-freq" data-tk="단계" aria-labelledby="nf-h"><div class="fq" id="fq" data-st="0">
  <canvas class="fq-cv" id="fqC" aria-hidden="true"></canvas>
  <div class="fq-c">
    <p class="fq-k"><b id="fqD">1</b>일째 · <span id="fqN">고요함</span></p>
    <h2 id="nf-h">주고받을수록,<br>색이 선명해져요.</h2>
    <p class="fq-s" id="fqS" aria-live="polite">아직 스치는 사이예요</p>
    <div class="fq-st" id="fqSt" role="group" aria-label="주파수 단계"><button type="button" aria-pressed="true">고요함</button><button type="button" aria-pressed="false">선명함</button><button type="button" aria-pressed="false">곧 열림</button><button type="button" aria-pressed="false">열림</button></div>
  </div>
  <ol class="fq-days" id="fqDays" aria-hidden="true"></ol>
</div></section>'''

def platter():
    names = [('기본', ['소셜', '상태', '텍스트', '이미지', '음악', '영상']), ('기록', ['To-do', 'D-Day', '포스트', '기분']), ('함께', ['방명록', '스티커 보드', 'Together']), ('미디어', ['GIF', '플레이리스트'])]
    wl = '<div class="wrap"><ul class="wl">%s</ul></div>' % ''.join('<li><h3>%s %d</h3><ul>%s</ul></li>' % (g, len(v), ''.join('<li>%s</li>' % x for x in v)) for g, v in names)
    return dict(title='플래터', h1='요즘의 나를,<br>한 접시에 올려 두는 일.', hero='내 플래터를 꾸미는 사람', body='\n'.join([
        sec(1, '플래터란', intro('플래터는 요즘의 나를 올려 두는 접시예요. 사진, 음악, 기분, 할 일을 위젯으로 놓으면 그게 내 방이 돼요.') + '\n<div class="sec">' + big('Platter', '#E7DBFD') + '</div>', 'k-ch'),
        sec(2, '꾸미는 법', pin('p', ['하나', '둘', '셋'], ['게시물을 올리는 대신,', '칸마다 위젯을 놓고,', '친구를 방으로 불러요.'], ['빈 플래터 화면', '위젯을 놓는 화면', '친구가 놀러 온 화면'], ['#E7DBFD', '#07E7B4', '#4A4BC0']), 'k-ch'),
        sec(3, '세 가지 약속', sl('방 주인은<br>언제나 나예요.', '플래터에는 순서를 정하는 알고리즘도, 남과 견주는 숫자도 없어요.', [('크기도 자리도 내가', '작은 2×2칸부터 큰 6×4칸까지. 위젯마다 크기를 고르고 원하는 자리에 놓아요.'), ('숫자가 없어요', '좋아요와 팔로워 숫자는 어디에도 보여 주지 않아요. 꾸민 모습만 남아요.'), ('친구마다 하나의 방', '끝없이 이어지는 피드 대신, 친구 한 명마다 플래터 하나를 찾아가요.')])),
        sec(4, '위젯', head('', '놓을 수 있는 조각은<br>열다섯 가지.', '기본, 기록, 함께, 미디어. 네 갈래에서 골라요.') + chips([[x for g, v in names for x in v][:8], [x for g, v in names for x in v][8:]]) + wl),
        dark('보여주려고 올리는 피드 말고,<br>놀러 오라고 꾸미는 방.'),
    ]), end=('꾸미고', '놀러 가요'))

def ditto():
    return dict(title='디토', h1='좋아요 대신,<br>“나도.”', hero='친구 방에서 위젯을 누르는 손', body='\n'.join([
        sec(1, '디토란', intro('디토는 “나도”라는 뜻이에요. 좋아요는 누르면 끝나지만, 디토한 조각은 내 방에 남아 둘 사이의 이야깃거리가 돼요.') + '\n<div class="sec">' + big('Ditto!', '#07E7B4') + '</div>', 'k-ch'),
        sec(2, '꾹 누르기', head('', '3초 동안,<br>꾹.', '마음에 든 조각을 누르고 있으면 보랏빛이 차올라요. 중간에 떼면 취소돼요.') + HOLD),
        sec(3, '네 단계', head('', '빛나는 조각이<br>내 방에 놓이기까지.') + flip([('빛나는 사진', '주인이 디토를 열어 둔 조각은 뒤에서 은은하게 빛나요. 한 사람이 열어 둘 수 있는 건 세 개까지예요.'), ('꾹 눌러 가져오기', '어디에 둘지 고르고 3초 동안 누르면 내 플래터로 와요.'), ('출처가 남아요', '가져온 조각에는 누구에게서 왔는지 칩과 디토 배지가 붙고, 친구에게도 알림이 가요.'), ('내 방 한쪽에', '디토가 끝나면 고른 플래터에 자리를 내줘요. 그날 같이 있었던 순간이 내 방에도 남아요.')])),
        sec(4, '세 가지 움직임', pin('d', ['살펴보기', '가져오기', '퍼뜨리기'], ['친구와 친구의 친구 방을 구경하고,', '빛나는 조각을 꾹 눌러 가져오면,', '그 조각이 친구의 친구에게까지 퍼져요.'], ['친구 방을 구경하는 화면', '디토하는 화면', '조각이 퍼지는 화면'], ['#E7DBFD', '#07E7B4', '#4A4BC0']), 'k-ch sec'),
        sec(5, '자주 묻는 질문', head('', '디토와 플래터,<br>자주 묻는 것.') + qa([('디토는 몇 개까지 열어 둘 수 있어요?', '내 위젯 중 세 개까지예요. 사진, GIF, 음악, 영상을 열어 둘 수 있고, 열어 둔 위젯은 뒤에서 은은하게 빛나서 친구가 알아볼 수 있어요.'), ('내 플래터는 누가 볼 수 있어요?', '친구로 연결된 사람만 볼 수 있어요. 친구 신청을 수락하면 서로의 플래터를 함께 볼 수 있어요.'), ('가져온 조각은 누구 건지 남나요?', '네. 가져온 조각에는 누구에게서 왔는지 칩과 디토 배지가 붙어요.')])),
        dark('멀리 갈수록 이름 대신<br>횟수만 보여요.', '다녀간 발자국은 방 주인에게만 남아요.'),
    ]), end=('나도', '너도'))

def frequency():
    return dict(title='주파수', h1='말하지 않아도,<br>맞아 가는 사이.', hero='나란히 걷는 두 친구', body='\n'.join([
        sec(1, '주파수란', intro('주파수는 두 사람 사이에 쌓인 마음이에요. 숫자로 보여 주지 않고, 색으로만 보여 줘요. 그리고 나에게만 보여요.'), 'k-ch'),
        FREQ,
        sec(3, '쌓이는 것', head('', '최근 21일 동안,<br>이런 것들이 쌓여요.', '몰래 보기만 해서는 열리지 않아요. 여러 날에 걸쳐, 둘이 함께 주고받은 순간이 있어야 해요.') + steps([('방문', '친구의 방에 놀러 간 날이 하루씩 쌓여요.'), ('함께한 반응과 댓글', '같은 조각에 함께 반응하고 댓글을 달아요.'), ('같은 날의 그룹 대화', '같은 방에서 같은 날 이야기를 나눠요.'), ('디토', '서로의 조각을 가져와요. 서로 디토하면 더 크게 쌓여요.')])),
        sec(4, '다섯 걸음', head('', '친구가 되는<br>다섯 걸음.') + steps([('교류가 생겨요', '친구의 친구 위젯에 같이 댓글을 달거나, 같은 그룹에서 이야기하거나, 서로의 사진을 디토하면 둘 사이에 주파수가 생겨요.'), ('색으로 선명해져요', '교류가 쌓일수록 잔잔한 회색에서 선명한 민트, 곧 열릴 즈음의 인디고로 바뀌어요.'), ('세 가지가 모이면 열려요', '교류가 충분히 쌓이고, 4일 이상 여러 날에 걸쳐, 함께 주고받은 순간이 있으면 친구 신청이 열려요.'), ('편지와 애칭을 붙여 신청', '짧은 편지와 서로를 부를 애칭은 골라서 적어요. 비워 둬도 신청할 수 있어요.'), ('수락하면 친구', '거절해도 보낸 사람에겐 알리지 않아요. 친구는 서로 15명까지예요.')])),
        sec(5, '다른 길', sl('주파수 말고도,<br>이어지는 길.', '이미 아는 사이라면 기다리지 않아도 돼요.', [('일상 속 작은 교류', '방문, 함께 남긴 댓글, 같은 날의 그룹 대화, 디토가 천천히 쌓여 주파수가 돼요.'), ('직접 받은 초대', '나를 이미 아는 사람이 나를 소개해요. 처음 10명의 친구는 초대를 통해 바로 연결될 수 있어요.'), ('직접 만나 함께한 시간', '같은 장소에 있는 사람은 ‘주변 찾기’로 서로를 발견해요. 위치는 공유하지 않아요.')], '길')),
        sec(6, '자주 묻는 질문', head('', '친구 신청,<br>자주 묻는 것.') + qa([('친구 신청은 언제 열려요?', '최근 3주 동안 함께 단 댓글, 같은 그룹에서의 대화, 주고받은 디토가 쌓이면 주파수가 선명해져요. 4일 이상 여러 날에 걸쳐 둘이 함께 주고받은 순간이 있어야 열려요.'), ('친구 신청을 거절하면 알려지나요?', '아니요. 거절해도 보낸 사람에게 알림이 가지 않아요. 모르는 사람이면 차단해서 다시 못 보내게 할 수 있어요.'), ('왜 친구가 15명까지인가요?', '사람이 가깝게 챙길 수 있는 관계가 15명 안팎이라는 던바의 연구를 따랐어요. 숫자를 늘리는 대신 이미 소중한 사람과의 거리를 좁혀요.')])),
        dark('놀이터에서 자꾸 함께 놀던 아이가<br>진짜 친구가 되었듯.', '디토의 우정도 다시 찾아가는 시간 속에서 자라요.'),
    ]), end=('고요', '선명'))

def play():
    cams = [('토스 27', '1999 · 일회용 필름 카메라'), ('VHS 캠', '1980 · 어깨형 VHS 캠코더'), ('픽셀 팔', '1998 · 휴대용 게임 카메라'), ('아날로그 포토부스', '1980 · 은염 인화 포토부스'), ('클램셸 05', '2005 · 폴더폰')]
    st = '<div class="wrap"><div class="st">%s</div></div>' % ''.join('<button type="button" data-n="%02d" aria-pressed="%s" style="--t:%s"><span><b>%s</b><small>%s</small></span></button>' % (k + 1, 'true' if k == 0 else 'false', T[k], a, b) for k, (a, b) in enumerate(cams))
    five = [('사진 부스', '함께 찍는 네컷 사진'), ('캠코더', '그 시절 화면 그대로'), ('무전기', '우리끼리 모이는 그룹 채팅'), ('편지', '편지로 전하는 친구 신청'), ('방명록', '친구가 남기고 가는 한마디')]
    rail = '<section class="k-ch k-rail" id="n-play" data-tk="다섯 가지 놀이"><div class="k-rail-st"><div class="wrap k-st"><h2>오래 사랑받던<br>다섯 가지 놀이.</h2><p>직접 겪어 보지 못한 아날로그를, 스마트폰 안에서 새로 만나요.</p></div><ul class="k-pl" id="kRail">%s</ul></div></section>' % ''.join('<li>%s<b>%s</b><span>%s</span></li>' % (ph(a + ' 장면', '5:4', T[k]), a, b) for k, (a, b) in enumerate(five))
    return dict(title='놀이', h1='만나면,<br>더 재밌어요.', hero='함께 사진을 찍는 친구들', body='\n'.join([
        sec(1, '놀이란', intro('이 경험들은 혼자보다 함께할 때 빛나요. 친구가 만나면 디토는 함께할 거리를 건네요.') + '<div class="wrap sec"><p class="rw">만나면, <span class="rw-b" data-words="찍고|듣고|쓰고|남기고"><i>찍고</i></span> 싶어져요.</p></div>', 'k-ch'),
        rail,
        sec(3, '카메라', head('', '다양한 카메라로,<br>같은 순간을 다르게.', '고른 카메라에 따라 셔터와 화면 표시, 사진의 색감이 달라져요.') + st),
        sec(4, '함께 찍기', head('', '찍고, 기다리고,<br>같이 열어 봐요.') + steps([('사진 부스에서 네 컷', '친구를 최대 3명 태그하고 3초 간격으로 네 장을 찍어요. 프레임과 한 줄 문구로 꾸며요.'), ('함께 쓰는 카메라', '카메라를 고르고 함께 있는 친구를 초대해요. 12·24·36장을 고르고, 현상 전에는 사진을 볼 수 없어요.'), ('아침 7시에 공개', '자정까지 찍은 필름은 다음 날 아침 모두에게 한꺼번에 공개돼요. 인화한 사진을 찾으러 가는 것처럼요.')])),
        sec(5, '그룹 채팅', head('', '친구들과 나누는 대화는,<br>그룹 채팅에서.', '방을 만들고 친구를 초대해 메신저처럼 이야기해요.') + cards([('답장과 반응', '밀어서 답장하고, 두 번 눌러 하트를 남겨요.'), ('대화 중에 바로 찍기', '사진과 스티커를 대화 속으로 바로 보내요.'), ('공유 보드', '방에 올린 위젯은 공유 보드에 모여 함께 쌓여요.')], 3, '기능')),
        dark('만나기 → 함께 찍기 →<br>플래터에 간직하기 → 다시 만나기.', '함께 만든 결과는 다음 만남으로 이어져요.'),
    ]), end=('만나고', '또 만나요'))

def story():
    fg = [('20.9', '%', '13~17세가 외로움을 느껴요. 전 세계 연령대 중 가장 높은 비율이에요.', '세계보건기구, 2025'), ('150 → 40', '분', '미국 15~24세가 친구와 보내는 하루 평균 시간이 이만큼 줄었어요.', '2003~2020년 · 미국 공중보건서비스단장, 2023'), ('71', '%', '페이스북 이용자가 게시물을 쓰고도 공유하지 않은 경험이 있어요.', 'Das·Kramer, ICWSM, 2013'), ('4.1', '명', '페이스북 친구 약 150명 중 위기 때 도움을 줄 친구는 평균 이 정도예요.', 'Dunbar, Royal Society Open Science, 2016'), ('32.2', '%', '한국의 20대가 평소 외롭다고 답했어요.', '통계청, 2025년 사회조사')]
    fgs = '<div class="wrap"><ul class="fg">%s</ul></div>' % ''.join('<li><b>%s<i>%s</i></b><p>%s<small>%s</small></p></li>' % x for x in fg)
    ba = [('한 번 눌러 팔로우', '주파수로 맺는 친구'), ('좋아요와 공개된 숫자', '출처를 남기는 디토'), ('끝없이 이어지는 피드', '친구마다 하나의 플래터'), ('화면 앞에서 보내는 시간', '함께 보내는 시간')]
    bas = '<div class="wrap"><ul class="ba">%s</ul></div>' % ''.join('<li><s>%s</s><i>→</i><span>%s</span></li>' % x for x in ba)
    return dict(title='이야기', h1='화면 속이 아니라,<br>곁에 있고 싶어서요.', hero='모여 앉아 웃는 친구들', body='\n'.join([
        sec(1, '만든 이유', intro('가장 많이 연결된 세대가 가장 외로워요. 연락은 쉬워졌지만 함께하는 시간은 줄었고, 공개 피드는 일상 공유를 남에게 보여주는 일로 바꿨어요.'), 'k-ch'),
        sec(2, '숫자로 본 문제', head('', '가까워지기<br>어려워지는 이유.') + fgs),
        fb('혼자 화면을 보는 사람'),
        dark('디토는 이미 알고 지내는<br>친구들을 위한 작은 공간이에요.'),
        sec(3, '달라지는 것', head('', '소셜 앱의<br>네 가지 습관을 바꿔요.') + bas),
        sec(4, '자라는 방식', head('', '작은 교류가<br>우정으로 자라는 방식.', '도달 범위보다 관계에 집중하면 소셜 앱은 진짜 친구를 만나고 우정을 키우는 공간이 될 수 있어요.') + steps([('플래터에서 위젯을 나눠요', '피드에 글을 올리기보다, 내 방을 꾸며 친구에게 보여 줘요.'), ('주파수가 돼요', '방문, 댓글, 디토가 쌓여 둘 사이의 주파수가 돼요.'), ('오프라인으로 이어져요', '직접 만나 함께 촬영하며 우정을 이어가요.'), ('새로운 사람이 찾아와요', '친구의 초대를 통해 친구의 친구를 만나요.')])),
        sec(5, '출처', '<div class="wrap"><p class="src-t">세계보건기구, 「외로움에서 사회적 연결로」(2025) · 미국 공중보건서비스단장, 「외로움과 고립의 유행」(2023) · Das·Kramer, 「페이스북에서의 자기검열」, ICWSM(2013) · Dunbar, Royal Society Open Science 3:150292(2016) · 통계청, 「2025년 사회조사」 · Hall, Journal of Social and Personal Relationships 36(4)(2019)</p></div>', 'k-ch sec sec-l'),
    ]), end=('화면 밖', '곁으로'))

BUILD = dict(platter=platter, ditto=ditto, frequency=frequency, play=play, story=story)
def page(slug, d, nxt):
    nav = ''.join('<li><a href="/%s/"%s>%s</a></li>' % (s, ' aria-current="page"' if s == slug else '', n) for s, n in PAGES)
    return '''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>%(title)s · Ditto!</title>
<meta name="description" content="%(desc)s">
<link rel="icon" href="/favicon.ico">
<link rel="preload" href="/assets/pretendard-ditto.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css"><link rel="stylesheet" href="/assets/v7.css">
</head>
<body class="sp">
%(apl)s
<header class="sn"><a class="sn-logo" href="/" aria-label="Ditto! 홈으로"><img src="/assets/wordmark.svg" alt="Ditto!" width="66" height="24"></a><nav aria-label="페이지"><ul>%(nav)s</ul></nav><a class="sn-cta" href="%(app)s">앱 받기</a></header>
<nav class="tk" aria-label="이 페이지의 장"></nav>
<main>
<section class="sh0" id="top">%(hero)s<div class="sh0-c"><p class="sh0-k">Ditto! · %(title)s</p><h1>%(h1)s</h1></div></section>
%(body)s
<section class="nx" aria-label="다음 페이지"><p class="nx-w" aria-hidden="true"><span>%(e1)s</span><span>%(e2)s</span></p><a class="nx-a" href="/%(nslug)s/"><small>다음 이야기</small><b>%(nname)s →</b></a></section>
</main>
<footer class="sf"><div class="wrap"><div class="sf-in">
  <p class="sf-s">우리로부터 시작되는<br>작은 공간.</p>
  <div><h4>디토</h4><ul>%(flinks)s</ul></div>
  <div><h4>시작하기</h4><ul><li><a href="%(app)s">App Store</a></li><li><a href="/#tm">초대장 뽑기</a></li><li><a href="/#qa">자주 묻는 질문</a></li></ul></div>
  <div><h4>안내</h4><ul><li><a href="/splup/">디자인 가이드</a></li><li><a href="/privacy/">개인정보 처리방침</a></li><li><a href="/terms/">이용약관</a></li></ul></div>
</div><p class="sf-c">© 2026 Ditto! · Halo Studio (Sangwook Park). All rights reserved.</p></div></footer>
<script src="/assets/v7.js" defer></script><script src="/assets/site.js" defer></script>
</body></html>
''' % dict(apl=APL, title=d['title'], desc=d['h1'].replace('<br>', ' '), nav=nav, app=APP, hero=ph(d['hero'] + ' · 화면 가득', '16:9', '', 'ph-d'), h1=d['h1'], body=d['body'], e1=d['end'][0], e2=d['end'][1], nslug=nxt[0], nname=nxt[1], flinks=''.join('<li><a href="/%s/">%s</a></li>' % p for p in PAGES))

for k, (slug, name) in enumerate(PAGES):
    d = BUILD[slug](); nxt = PAGES[k + 1] if k + 1 < len(PAGES) else ('', '처음으로')
    out = ROOT / slug / 'index.html'; out.parent.mkdir(exist_ok=True)
    html = page(slug, d, nxt)
    if not nxt[0]: html = html.replace('href="//"', 'href="/"')
    out.write_text(html, encoding='utf-8'); print(out, len(html))
