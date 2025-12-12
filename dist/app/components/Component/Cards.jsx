"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lucide_react_1 = require("lucide-react");
const react_1 = __importDefault(require("react"));
const PracticeLine = ({ line, type }) => (<li className="flex items-start gap-3">
    {type === 'positive' ? (<lucide_react_1.Check className="mt-[5px] h-3 w-3 shrink-0 text-emerald-600" strokeWidth={3}/>) : type === 'negative' ? (<lucide_react_1.X className="mt-[5px] h-3 w-3 shrink-0 text-gray-400" strokeWidth={3}/>) : (<span className="mt-[5px] h-3 w-3 shrink-0"/>)}
    <p className="text-sm">{line}</p>
  </li>);
const CardItem = ({ card }) => {
    // Split content by newlines and render each line as a separate item
    const lines = card.content.split('\n').filter((line) => line.trim());
    return (<ul className="space-y-3 text-emerald-800">
      {lines.map((line, index) => (<PracticeLine line={line} type={card.type} key={`do-rule-${index}`}/>))}
    </ul>);
};
const Cards = ({ cards, maxCardsPerRow = 2, className = '' }) => {
    if (!cards || cards.length === 0) {
        return null;
    }
    return (<div className="grid grid-cols-[repeat(auto-fit,minmax(100%,1fr))] gap-6 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
      {cards.map((card, index) => (<div key={`card-${index}`} className="relative rounded-lg border bg-gray-50 p-8 text-gray-600 dark:bg-gray-800">
          <h2 className="mb-3 font-normal text-gray-700">
            {card.title}
          </h2>
          <CardItem card={card}/>
        </div>))}
    </div>);
};
exports.default = Cards;
