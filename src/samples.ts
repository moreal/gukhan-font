/** Sentences the demo and the font's shaping checks both use. */
export const SAMPLES: { text: string, reading: string, note: string }[] = [
  {
    text: '國漢文混用',
    reading: '국한문혼용',
    note: '글자마다 한 음절. 합자가 없어도 읽힌다.',
  },
  {
    text: '大韓民國의 憲法',
    reading: '대한민국의 헌법',
    note: '한자와 한글은 서로 다른 글자 묶음이다.',
  },
  {
    text: '女子와 男女',
    reading: '여자와 남녀',
    note: '두음 법칙. 女는 첫소리에서만 여.',
  },
  {
    text: '音樂과 快樂',
    reading: '음악과 쾌락',
    note: '樂은 단어에 따라 악 또는 락. 音樂만 합자.',
  },
  {
    text: '平壤 冷麵',
    reading: '평양 냉면',
    note: '남한식 두음. 冷은 첫소리에서 냉.',
  },
  {
    text: '來日과 未來',
    reading: '내일과 미래',
    note: '來는 첫소리에서 내, 그 외에는 래.',
  },
  {
    text: '困難한 問題',
    reading: '곤란한 문제',
    note: '困難은 곤난이 아니라 곤란. 합자로 고친다.',
  },
  {
    text: '六月과 十月, 五六',
    reading: '유월과 시월, 오륙',
    note: '六月·十月은 사전 읽음. 五六은 글자 읽음.',
  },
  {
    text: '法律, 比率, 規律, 利率, 分裂',
    reading: '법률, 비율, 규율, 이율, 분열',
    note: '률은 받침에 따라 률로 남거나 율이 된다.',
  },
  {
    text: '漢字로 쓴 글',
    reading: '한자로 쓴 글',
    note: '모르는 한자도 글자 읽음이 붙는다.',
  },
]
