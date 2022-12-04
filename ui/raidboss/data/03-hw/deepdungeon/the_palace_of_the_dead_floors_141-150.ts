import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Palace of the Dead Floors 141-150

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.ThePalaceOfTheDeadFloors141_150,

  triggers: [
    // ---------------- Floor 141-149 Mobs ----------------
    {
      id: 'PotD 141-150 Deep Palace Bhoot Paralyze III',
      // inflicts Paralyze
      type: 'StartsUsing',
      netRegex: { id: '18F2', source: 'Deep Palace Bhoot' },
      response: Responses.stunOrInterruptIfPossible(),
    },
    {
      id: 'PotD 141-150 Deep Palace Persona Paralyze III',
      // same ability name, different mob
      // inflicts Paralyze
      type: 'StartsUsing',
      netRegex: { id: '18F4', source: 'Deep Palace Persona' },
      response: Responses.stunOrInterruptIfPossible(),
    },
    {
      id: 'PotD 141-150 Deep Palace Wraith Scream',
      // inflicts Terror (42)
      type: 'StartsUsing',
      netRegex: { id: '190A', source: 'Deep Palace Wraith' },
      response: Responses.stunOrInterruptIfPossible(),
    },
    {
      id: 'PotD 141-150 Deep Palace Succubus Void Fire IV',
      // very large AoE
      type: 'StartsUsing',
      netRegex: { id: '1B81', source: 'Deep Palace Succubus' },
      response: Responses.stunOrInterruptIfPossible(),
    },
    {
      id: 'PotD 141-150 Deep Palace Manticore Ripper Claw',
      // untelegraphed front cone AoE
      type: 'StartsUsing',
      netRegex: { id: '18FA', source: 'Deep Palace Manticore', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'PotD 141-150 Onyx Dragon Evil Eye',
      // gaze, inflicts Terror (42), combos with Miasma Breath (1B82)
      type: 'StartsUsing',
      netRegex: { id: '1B83', source: 'Onyx Dragon', capture: false },
      response: Responses.lookAway('alert'),
    },
    // ---------------- Floor 150 Boss: Tisiphone ----------------
    {
      id: 'PotD 141-150 Tisiphone Blood Rain',
      // big roomwide AoE
      type: 'StartsUsing',
      netRegex: { id: '1BF1', source: 'Tisiphone', capture: false },
      response: Responses.bigAoe('alert'),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Deep Palace Bhoot': 'Katakomben-Bhut',
        'Deep Palace Manticore': 'Katakomben-Manticore',
        'Deep Palace Persona': 'Katakomben-Persona',
        'Deep Palace Succubus': 'Katakomben-Sukkubus',
        'Deep Palace Wraith': 'Katakomben-Geist',
        'Onyx Dragon': 'Onyxdrache',
        'Tisiphone': 'Tisiphone',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Deep Palace Bhoot': 'bhut des profondeurs',
        'Deep Palace Manticore': 'manticore des profondeurs',
        'Deep Palace Persona': 'persona des profondeurs',
        'Deep Palace Succubus': 'succube des profondeurs',
        'Deep Palace Wraith': 'spectre des profondeurs',
        'Onyx Dragon': 'dragon d\'onyx',
        'Tisiphone': 'Tisiphone',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Deep Palace Bhoot': '«Ç«£?«×«Ñ«ì«¹?«Ö«Õ?«È',
        'Deep Palace Manticore': '«Ç«£?«×«Ñ«ì«¹?«Þ«ó«Æ«£«³«¢',
        'Deep Palace Persona': '«Ç«£?«×«Ñ«ì«¹?«Ú«ë«½«Ê',
        'Deep Palace Succubus': '«Ç«£?«×«Ñ«ì«¹?«µ«­«å«Ð«¹',
        'Deep Palace Wraith': '«Ç«£?«×«Ñ«ì«¹?«ì«¤«¹',
        'Onyx Dragon': '«ª«Ë«­«¹«É«é«´«ó',
        'Tisiphone': '«Æ«£?«·«Ý«Í?',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Deep Palace Bhoot': 'ä¢?Ý©?',
        'Deep Palace Manticore': 'ä¢?Øºð«Ðº',
        'Deep Palace Persona': 'ä¢?Ê£Øü',
        'Deep Palace Succubus': 'ä¢??Øª',
        'Deep Palace Wraith': 'ä¢?êë?',
        'Onyx Dragon': '?ÒùÐºÞÙ?',
        'Tisiphone': 'ð«à¤ÜØæî',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Deep Palace Bhoot': '±íÀº ±ÃÀü ºêÈÄÆ®',
        'Deep Palace Manticore': '±íÀº ±ÃÀü ¸¸Æ¼ÄÚ¾î',
        'Deep Palace Persona': '±íÀº ±ÃÀü Æä¸£¼Ò³ª',
        'Deep Palace Succubus': '±íÀº ±ÃÀü ¼­Å¥¹ö½º',
        'Deep Palace Wraith': '±íÀº ±ÃÀü ¸Á·É',
        'Onyx Dragon': 'ÁÙ¸¶³ë µå·¡°ï',
        'Tisiphone': 'Æ¼½ÃÆ÷³×',
      },
    },
  ],
};

export default triggerSet;
