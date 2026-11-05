import { fr } from '@codegouvfr/react-dsfr';
import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons';
import useBaseLayerCatalogue from '../../hooks/useBaseLayerCatalogue';
import { useMapStore } from '../../store/useMapStore';

const TITLE_ID = 'titre-fonds-de-carte';

/** DSFR side panel listing the available base layers as radio buttons (arrow keys switch layers). */
export default function BaseLayerPanel() {
  const { layers, activeLayer, isPending, isError } = useBaseLayerCatalogue();
  const setActiveBaseLayer = useMapStore((state) => state.setActiveBaseLayer);

  return (
    <section aria-labelledby={TITLE_ID} className={fr.cx('fr-p-2w')}>
      <h2 id={TITLE_ID} className={fr.cx('fr-h6')}>
        Fonds de carte
      </h2>
      {isPending && <p role="status">Chargement des fonds de carte…</p>}
      {!isPending && !isError && layers.length === 0 && (
        <p>Aucun fond de carte n’est disponible pour le moment.</p>
      )}
      {isError && <p>Les fonds de carte n’ont pas pu être chargés.</p>}
      {layers.length > 0 && (
        <RadioButtons
          legend="Choisir le fond de carte affiché"
          name="fond-de-carte"
          small
          options={layers.map((layer) => ({
            label: layer.title,
            nativeInputProps: {
              value: layer.id,
              checked: layer.id === activeLayer?.id,
              onChange: () => setActiveBaseLayer(layer.id),
            },
          }))}
        />
      )}
    </section>
  );
}
