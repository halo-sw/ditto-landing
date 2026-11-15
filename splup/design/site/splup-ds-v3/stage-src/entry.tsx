// 디자인 가이드 처음 화면의 큰 타일에 Stageshow 시연(디토하기)을 올린다. 묶는 법은 README.md.
import { createRoot } from 'react-dom/client'
import DittoHold from './ditto'

const el = document.getElementById('xkStage')
if (el) createRoot(el).render(<DittoHold />)
