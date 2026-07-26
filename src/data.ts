/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Meeting, DaySchedule } from './types';

export const MEETINGS: Meeting[] = [
  // Domingo
  { id: 'dom-08', day: 0, dayName: 'Domingo', theme: 'Encontro com Deus', time: '08:00', hours: 8, minutes: 0 },
  { id: 'dom-18', day: 0, dayName: 'Domingo', theme: 'Encontro com Deus', time: '18:00', hours: 18, minutes: 0 },

  // Segunda
  { id: 'seg-08', day: 1, dayName: 'Segunda-feira', theme: 'Prosperidade com Deus', time: '08:00', hours: 8, minutes: 0 },
  { id: 'seg-15', day: 1, dayName: 'Segunda-feira', theme: 'Prosperidade com Deus', time: '15:00', hours: 15, minutes: 0 },
  { id: 'seg-1930', day: 1, dayName: 'Segunda-feira', theme: 'Prosperidade com Deus', time: '19:30', hours: 19, minutes: 30 },

  // Terça
  { id: 'ter-08', day: 2, dayName: 'Terça-feira', theme: 'Corrente dos 70', time: '08:00', hours: 8, minutes: 0 },
  { id: 'ter-15', day: 2, dayName: 'Terça-feira', theme: 'Corrente dos 70', time: '15:00', hours: 15, minutes: 0 },
  { id: 'ter-1930', day: 2, dayName: 'Terça-feira', theme: 'Corrente dos 70', time: '19:30', hours: 19, minutes: 30 },

  // Quarta
  { id: 'qua-08', day: 3, dayName: 'Quarta-feira', theme: 'Escola da Fé Inteligente', time: '08:00', hours: 8, minutes: 0 },
  { id: 'qua-15', day: 3, dayName: 'Quarta-feira', theme: 'Escola da Fé Inteligente', time: '15:00', hours: 15, minutes: 0 },
  { id: 'qua-1930', day: 3, dayName: 'Quarta-feira', theme: 'Escola da Fé Inteligente', time: '19:30', hours: 19, minutes: 30 },

  // Quinta
  { id: 'qui-15', day: 4, dayName: 'Quinta-feira', theme: 'Terapia do Amor', time: '15:00', hours: 15, minutes: 0 },
  { id: 'qui-1930', day: 4, dayName: 'Quinta-feira', theme: 'Terapia do Amor', time: '19:30', hours: 19, minutes: 30 },

  // Sexta
  { id: 'sex-08', day: 5, dayName: 'Sexta-feira', theme: 'Sessão do Descarrego', time: '08:00', hours: 8, minutes: 0 },
  { id: 'sex-15', day: 5, dayName: 'Sexta-feira', theme: 'Sessão do Descarrego', time: '15:00', hours: 15, minutes: 0 },
  { id: 'sex-1930', day: 5, dayName: 'Sexta-feira', theme: 'Sessão do Descarrego', time: '19:30', hours: 19, minutes: 30 },

  // Sábado
  { id: 'sab-07', day: 6, dayName: 'Sábado', theme: 'Jejum das Causas Impossíveis', time: '07:00', hours: 7, minutes: 0 },
  { id: 'sab-15', day: 6, dayName: 'Sábado', theme: 'Encontro Jovem', time: '15:00', hours: 15, minutes: 0 },
];

export const WEEK_SCHEDULES: DaySchedule[] = [
  {
    dayName: 'Domingo',
    dayIndex: 0,
    theme: 'Encontro com Deus',
    times: ['08h', '18h'],
  },
  {
    dayName: 'Segunda-feira',
    dayIndex: 1,
    theme: 'Prosperidade com Deus',
    times: ['08h', '15h', '19h30'],
  },
  {
    dayName: 'Terça-feira',
    dayIndex: 2,
    theme: 'Corrente dos 70',
    times: ['08h', '15h', '19h30'],
  },
  {
    dayName: 'Quarta-feira',
    dayIndex: 3,
    theme: 'Escola da Fé Inteligente',
    times: ['08h', '15h', '19h30'],
  },
  {
    dayName: 'Quinta-feira',
    dayIndex: 4,
    theme: 'Terapia do Amor',
    times: ['15h', '19h30'],
  },
  {
    dayName: 'Sexta-feira',
    dayIndex: 5,
    theme: 'Sessão do Descarrego',
    times: ['08h', '15h', '19h30'],
  },
  {
    dayName: 'Sábado',
    dayIndex: 6,
    theme: 'Causas Impossíveis',
    times: ['07h'],
  }
];

export const VERSES = [
  { text: "Não te mandei eu? Esforça-te, e tem bom ânimo; não temas, nem te espantes; porque o Senhor teu Deus é contigo, por onde quer que andares.", ref: "Josué 1:9 (ACF)" },
  { text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.", ref: "Isaías 41:10 (ACF)" },
  { text: "Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize.", ref: "João 14:27 (ACF)" },
  { text: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", ref: "Salmos 37:5 (ACF)" },
  { text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", ref: "Mateus 11:28 (ACF)" },
  { text: "Posso todas as coisas naquele que me fortalece.", ref: "Filipenses 4:13 (ACF)" },
  { text: "O Senhor é o meu pastor, nada me faltará.", ref: "Salmos 23:1 (ACF)" },
  { text: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.", ref: "Salmos 46:1 (ACF)" },
  { text: "Mas os que esperam no Senhor renovarão as forças, subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão.", ref: "Isaías 40:31 (ACF)" },
  { text: "Não estejais inquietos por coisa alguma; antes as vossas petições sejam em tudo conhecidas diante de Deus pela oração e súplicas, com ação de graças.", ref: "Filipenses 4:6 (ACF)" },
  { text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.", ref: "Romanos 8:28 (ACF)" },
  { text: "Elevarei os meus olhos para os montes, de onde vem o meu socorro. O meu socorro vem do Senhor, que fez o céu e a terra.", ref: "Salmos 121:1-2 (ACF)" },
  { text: "Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.", ref: "Provérbios 3:5-6 (ACF)" },
  { text: "E buscar-me-eis, e me achareis, quando me buscardes com todo o vosso coração.", ref: "Jeremias 29:13 (ACF)" },
  { text: "O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?", ref: "Salmos 27:1 (ACF)" },
  { text: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará. Direi do Senhor: Ele é o meu Deus, o meu refúgio, a minha fortaleza, e nele confiarei.", ref: "Salmos 91:1-2 (ACF)" },
  { text: "E Jesus disse-lhe: Se tu podes crer, tudo é possível ao que crê.", ref: "Marcos 9:23 (ACF)" },
  { text: "Mas, buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.", ref: "Mateus 6:33 (ACF)" },
  { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", ref: "João 3:16 (ACF)" },
  { text: "Que diremos, pois, a estas coisas? Se Deus é por nós, quem será contra nós?", ref: "Romanos 8:31 (ACF)" },
  { text: "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.", ref: "Hebreus 11:1 (ACF)" },
  { text: "O anjo do Senhor acampa-se ao redor dos que o temem, e os livra.", ref: "Salmos 34:7 (ACF)" },
  { text: "Quando passares pelas águas estarei contigo, e quando pelos rios, não te submergirão; quando passares pelo fogo, não te queimarás, nem a chama arderá em ti.", ref: "Isaías 43:2 (ACF)" },
  { text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.", ref: "1 Pedro 5:7 (ACF)" },
  { text: "Esforçai-vos, e animai-vos; não temais, nem vos espanteis diante deles; porque o Senhor vosso Deus é o que vai convosco; não vos deixará nem vos desamparará.", ref: "Deuteronômio 31:6 (ACF)" },
  { text: "Disse-lhe Jesus: Eu sou a ressurreição e a vida; quem crê em mim, ainda que esteja morto, viverá.", ref: "João 11:25 (ACF)" },
  { text: "Alegrai-vos na esperança, sede pacientes na tribulação, perseverai na oração.", ref: "Romanos 12:12 (ACF)" },
  { text: "Chegai-vos a Deus, e ele se chegará a vós.", ref: "Tiago 4:8 (ACF)" },
  { text: "Perto está o Senhor dos que têm o coração quebrantado, e salva os contritos de espírito.", ref: "Salmos 34:18 (ACF)" },
  { text: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.", ref: "Salmos 119:105 (ACF)" }
];

export const SOCIAL = {
  instagram: "@universaljardimosascooficial"
};

export const DONATION = {
  url: "https://universal.org/doar"
};

export const CAMPAIGNS = [
  {
    id: "camp_default_1",
    title: "Fogueira Santa\ndo Monte Sião",
    duration: "Até o final de Julho",
    iconType: "flame",
    endDate: "2026-07-31"
  },
  {
    id: "camp_default_2",
    title: "Jejum de\nDaniel",
    duration: "21 Dias de Propósito",
    iconType: "wifi_off",
    endDate: "2026-08-02"
  }
];

export const ALERTS = {
  baby: {
    buttonTitle: "Choro de Bebê",
    message: "Atenção pais: Compareçam ao berçário (EBI)."
  },
  car: {
    buttonTitle: "Veículo / Estacionamento",
    message: "Proprietário de veículo: Compareça ao estacionamento."
  }
};

export const CHURCH_INFO = {
  name: "Igreja Universal",
  location: "Jardim Osasco"
};

export const SLIDE_TIMING: Record<string, number> = {
  welcome: 8000,
  verses: 15000,
  donations: 20000,
  social: 12000,
  campaigns: 12000,
};
