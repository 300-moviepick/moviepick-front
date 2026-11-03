import { authApi } from '../../api/moviepick';
import { rememberRedirect } from '../../lib/authRedirect';
import { GoogleIcon, KakaoIcon } from '../../ui/brandIcons';
import styles from './Auth.module.css';

// 카카오·구글 소셜 로그인 시작 버튼. 백엔드 /oauth2/authorization/{provider}로 이동한다.
// 로그인 후 돌아올 주소는 sessionStorage에 저장해 두고 /oauth2/success에서 꺼낸다.
export default function SocialButtons({ mode = 'login', redirect = '/' }) {
  const start = (provider) => {
    rememberRedirect(redirect);
    window.location.assign(authApi.oauthUrl(provider));
  };
  const verb = mode === 'signup' ? '가입' : '로그인';

  return (
    <div className={styles.social}>
      <button type="button" className={styles.kakao} onClick={() => start('kakao')}>
        <KakaoIcon size={18} />
        카카오로 {verb}하기
      </button>
      <button type="button" className={styles.google} onClick={() => start('google')}>
        <GoogleIcon size={18} />
        Google 계정으로 {verb}하기
      </button>
    </div>
  );
}
