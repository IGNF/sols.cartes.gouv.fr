import { fr } from '@codegouvfr/react-dsfr';
import { headerFooterDisplayItem } from '@codegouvfr/react-dsfr/Display';
import { FooterBottomItem } from '@codegouvfr/react-dsfr/Footer';
import { BACK_TO_TOP_LABEL, BRAND } from '../../config/site';
import { FOOTER_ID, HEADER_ID } from '../../config/landmarks';
import './SiteFooter.css';

/**
 * Compact footer of the carto brick (`footer.compactOnCarto`, maquette 1:10562): only `fr-footer__bottom`
 * with the bottom links, « Paramètres d'affichage » (DSFR display modal, mounted by the Header) and a
 * « Haut de page » link. The full footer (partners, content links, licence) lives on the other bricks.
 */
export default function SiteFooter() {
  return (
    <footer className={`${fr.cx('fr-footer')} compact-footer`} id={FOOTER_ID}>
      <div className={fr.cx('fr-container')}>
        <div className={`${fr.cx('fr-footer__bottom')} compact-footer__bottom`}>
          <ul className={fr.cx('fr-footer__bottom-list')}>
            {BRAND.footer.bottomLinks.map((link) => (
              <li key={link.href} className={fr.cx('fr-footer__bottom-item')}>
                <a className={fr.cx('fr-footer__bottom-link')} href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
            <li className={fr.cx('fr-footer__bottom-item')}>
              <FooterBottomItem bottomItem={headerFooterDisplayItem} />
            </li>
          </ul>
          <a
            className={`${fr.cx('fr-link', 'fr-icon-arrow-up-line', 'fr-link--icon-left')} compact-footer__top`}
            href={`#${HEADER_ID}`}
          >
            {BACK_TO_TOP_LABEL}
          </a>
        </div>
      </div>
    </footer>
  );
}
