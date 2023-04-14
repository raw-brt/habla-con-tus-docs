import styles from '@/src/styles/loading-dots.module.css';
import { FC } from 'react';

interface Props {
  color?: string;
  style?: string;
}

const LoadingDots: FC<Props> = ({
  color = '#000',
  style = 'small',
}) => {
  return (
    <span className={style == 'small' ? styles.loading2 : styles.loading}>
      <span style={{ backgroundColor: color }} />
      <span style={{ backgroundColor: color }} />
      <span style={{ backgroundColor: color }} />
    </span>
  );
};

export default LoadingDots;
