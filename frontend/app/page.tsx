import OpeningScene from '@/components/OpeningScene';
import { ArchDefs } from '@/components/ArchArt';
import CoupleScene from '@/components/CoupleScene';
import FamiliesScene from '@/components/FamiliesScene';
import HolyScene from '@/components/HolyScene';
import OrderScene from '@/components/OrderScene';
import ReceptionScene from '@/components/ReceptionScene';
import RsvpScene from '@/components/RsvpScene';
import ClosingScene from '@/components/ClosingScene';
import Prewarm from '@/components/Prewarm';

export default function Home() {
  return (
    <main id="main">
      <ArchDefs />
      <OpeningScene />
      <CoupleScene />
      <FamiliesScene />
      <HolyScene />
      <OrderScene />
      <ReceptionScene />
      <RsvpScene />
      <ClosingScene />
      <Prewarm />
    </main>
  );
}
