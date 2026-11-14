import OpeningScene from '@/components/OpeningScene';
import CoupleScene from '@/components/CoupleScene';
import FamiliesScene from '@/components/FamiliesScene';
import HolyScene from '@/components/HolyScene';
import ReceptionScene from '@/components/ReceptionScene';
import RsvpScene from '@/components/RsvpScene';
import ClosingScene from '@/components/ClosingScene';

export default function Home() {
  return (
    <main id="main">
      <OpeningScene />
      <CoupleScene />
      <FamiliesScene />
      <HolyScene />
      <ReceptionScene />
      <RsvpScene />
      <ClosingScene />
    </main>
  );
}
