import { ApiError } from '../../api/client';
import { tmdbImage } from '../../lib/format';
import Button from '../../ui/Button';
import { IconExternal, IconRefresh, IconUser } from '../../ui/icons';
import styles from './MovieDetail.module.css';

/**
 * /api/movies/{movieId}/extras 결과를 그리는 영역들.
 * - 비로그인도 조회할 수 있는 공개 API다. 오류가 나도 이 영역만 안내를 보여 주고 상세 화면 나머지는 그대로 둔다.
 * - TMDB를 실시간으로 부르므로 느리거나 502일 수 있다.
 * - cast[].id, directors[].id는 TMDB 인물 ID라 링크에 쓰지 않는다.
 */
function ExtrasState({ extras, compact }) {
  if (extras.loading && !extras.data) {
    return (
      <div className={styles.extrasSkeleton} aria-busy="true" aria-label="불러오는 중">
        {Array.from({ length: compact ? 2 : 4 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
    );
  }
  const err = extras.error;
  return (
    <div className={styles.extrasNotice}>
      <p>{err instanceof ApiError && err.status === 502 ? '영화 정보 제공처(TMDB)에서 정보를 가져오지 못했습니다.' : err?.message || '정보를 불러오지 못했습니다.'}</p>
      <Button size="sm" variant="ghost" icon={<IconRefresh size={14} />} onClick={extras.reload}>
        다시 시도
      </Button>
    </div>
  );
}

export function CastSection({ extras }) {
  const data = extras.data;
  if (!data || extras.error) return <ExtrasState extras={extras} />;

  const people = [
    ...data.directors.map((d) => ({ key: `d-${d.id}`, name: d.name, role: '감독', profilePath: null })),
    ...data.cast.map((c) => ({ key: `c-${c.id}`, name: c.name, role: c.character ? `${c.character} 역` : '출연', profilePath: c.profilePath })),
  ];
  if (people.length === 0) return <p className={styles.muted}>등록된 출연진 정보가 없습니다.</p>;

  return (
    <ul className={styles.people}>
      {people.map((p) => {
        const img = tmdbImage(p.profilePath, 'w185');
        return (
          <li key={p.key} className={styles.person}>
            <span className={styles.personPhoto}>
              {img ? <img src={img} alt="" loading="lazy" /> : <IconUser size={28} />}
            </span>
            <strong>{p.name}</strong>
            <span>{p.role}</span>
          </li>
        );
      })}
    </ul>
  );
}

const OTT_GROUPS = [
  { key: 'streaming', label: '구독' },
  { key: 'rent', label: '대여' },
  { key: 'buy', label: '구매' },
];

export function OttSection({ extras }) {
  const data = extras.data;
  if (!data || extras.error) return <ExtrasState extras={extras} compact />;

  const groups = OTT_GROUPS.map((g) => ({ ...g, items: data[g.key] ?? [] })).filter((g) => g.items.length > 0);
  if (groups.length === 0) return <p className={styles.muted}>국내에서 시청 가능한 OTT 정보가 없습니다.</p>;

  return (
    <div className={styles.ott}>
      {groups.map((g) => (
        <div key={g.key} className={styles.ottGroup}>
          <span className={styles.ottLabel}>{g.label}</span>
          <ul className={styles.ottList}>
            {g.items.map((p) => {
              const logo = tmdbImage(p.logoPath, 'w92');
              return (
                <li key={`${g.key}-${p.providerId}`} className={styles.ottItem}>
                  {logo ? <img src={logo} alt="" loading="lazy" /> : <span className={styles.ottLogoFallback} />}
                  <span>{p.providerName}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {data.watchLink && (
        <Button href={data.watchLink} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm" iconRight={<IconExternal size={14} />}>
          시청 정보 자세히 보기 (TMDB)
        </Button>
      )}
      <p className={styles.attribution}>시청 정보 출처: TMDB · JustWatch</p>
    </div>
  );
}
