import { Outlet } from 'react-router-dom';
import DevLogPanel from '../components/DevLogPanel';
import TopBar from '../components/TopBar';

// 기존 화면용 틀. 새 화면 검증 전까지 /legacy/* 에서 기존 화면을 그대로 보여 준다.
// (기존 App.jsx의 감싸는 구조를 옮긴 것. 기존 컴포넌트는 수정하지 않는다.)
export default function LegacyLayout() {
  return (
    <div className="layout">
      <TopBar />
      <div className="body">
        <main className="main">
          <Outlet />
        </main>
        <DevLogPanel />
      </div>
    </div>
  );
}
