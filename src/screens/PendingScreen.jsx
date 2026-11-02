import Button from '../ui/Button';
import { IconHourglass } from '../ui/icons';
import { EmptyState } from '../ui/StateViews';

/**
 * 새 UI 구현 단계 동안 아직 만들지 않은 화면 자리.
 * (백엔드 기능이 없는 "준비 중"과 다르다. 해당 단계 구현 시 실제 화면으로 바뀐다.)
 * legacyTo가 있으면 기존 화면으로 가는 버튼을 보여 준다.
 */
export default function PendingScreen({ title, stage, legacyTo, padded = true }) {
  return (
    <div className={padded ? 'mp-container' : undefined} style={padded ? { padding: '48px var(--mp-page-x)' } : undefined}>
      <EmptyState
        icon={<IconHourglass size={22} />}
        title={`${title} 화면은 새 UI ${stage}단계에서 구현됩니다`}
        description="현재는 새 디자인 공통 레이아웃만 적용된 상태입니다."
        action={
          legacyTo && (
            <Button to={legacyTo} variant="secondary">
              기존 화면에서 보기
            </Button>
          )
        }
      />
    </div>
  );
}
