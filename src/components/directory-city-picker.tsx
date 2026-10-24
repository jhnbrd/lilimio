import { CityPicker, Modal, Button } from "../ui";
import { useApp } from "../state";
import type { DirectoryCenter } from "../lib/directory";
export function DirectoryCityPicker({
  onChoose,
  onClose,
}: {
  onChoose: (center: DirectoryCenter) => void;
  onClose: () => void;
}) {
  const { city } = useApp();
  return (
    <Modal title="Choose a relief search area" onClose={onClose}>
      {city && (
        <Button variant="outline" onClick={() => onChoose(city)}>
          Use forecast location: {city.name}
        </Button>
      )}
      <CityPicker chosen={city} onChoose={onChoose} />
    </Modal>
  );
}
