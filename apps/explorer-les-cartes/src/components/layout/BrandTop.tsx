import { BRAND_TOP } from '../../config/site';

/** "République Française" block of the Marianne logo, shared by header and footer. */
export default function BrandTop() {
  const [first, second] = BRAND_TOP;
  return (
    <>
      {first}
      <br />
      {second}
    </>
  );
}
