import StarFull from "apps/user-ui/src/assets/svgs/full-star";
import StarHalf from "apps/user-ui/src/assets/svgs/half-star";
import StarOutline from "apps/user-ui/src/assets/svgs/outline-star";
import { FC } from "react";

type Props = {
  rating: number;
  color?: string;
};

const Ratings: FC<Props> = ({ rating, color = "orange" }) => {
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      // bintang penuh
      stars.push(<StarFull key={`full-${i}`} color={color} />);
    } else if (rating >= i - 0.5) {
      // setengah bintang
      stars.push(<StarHalf key={`half-${i}`} color={color} />);
    } else {
      // bintang kosong
      stars.push(<StarOutline key={`empty-${i}`} color={color} />);
    }
  }

  return <div className="flex">{stars}</div>;
};

export default Ratings;
