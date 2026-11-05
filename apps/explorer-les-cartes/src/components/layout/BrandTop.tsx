import { SITE } from '../../config/site';

/** "République Française" block of the Marianne logo, shared by header and footer. */
export default function BrandTop() {
  const [first, second] = SITE.brandTop;
  return (
    <>
      {first}
      <br />
      {second}
    </>
  );
}
