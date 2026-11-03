import Button from '../ui/Button';
import { IconFilm } from '../ui/icons';
import { EmptyState } from '../ui/StateViews';

export default function NotFoundScreen() {
  return (
    <div className="mp-container" style={{ padding: '64px var(--mp-page-x)' }}>
      <EmptyState
        icon={<IconFilm size={22} />}
        title="페이지를 찾을 수 없습니다"
        description="주소가 바뀌었거나 삭제된 페이지입니다."
        action={
          <Button to="/" variant="primary">
            메인으로
          </Button>
        }
      />
    </div>
  );
}
