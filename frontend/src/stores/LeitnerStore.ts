import { defineStore } from 'pinia';
import { Card } from '@/models/Card';
import { SessionResult } from '@/models/SessionResult';

export const useLeitnerStore = defineStore('LeitnerStore', {
    state: () => ({
        cardsReadyForExport: new Map<string, Card>(), // CardId -> Card
        sessionResults: [] as SessionResult[],
        inSession: false
    }),
    actions: {
        importFile(json: string): boolean {
            let imported: Card[];
            try {
                imported = JSON.parse(json);
            } catch (e) {
                console.error('Invalid JSON:', e);
                return false;
            }

            this.cardsReadyForExport.clear();

            for (const Card of imported) {
                this.cardsReadyForExport.set(Card.id, Card);
            }

            return true;
        },

        exportData(): string {
            return JSON.stringify(Array.from(this.cardsReadyForExport.values()), null, 4);
        },

        addCard(Card: Card): void {
            this.cardsReadyForExport.set(Card.id, Card);
        },

        startSession(): void {
            this.sessionResults = [];
            this.inSession = true;
        },

        answerCard(cardId: string, newBoxId: number): void {
            this.sessionResults.push({ cardId, newBoxId });
        },

        endSession(): void {
            for (const { cardId, newBoxId } of this.sessionResults) {
                const oldBoxId = this.cardsReadyForExport.get(cardId)?.boxNumber;
                if (oldBoxId === undefined) {
                    console.error(`Card ${cardId} not found in cardsReadyForExport`);
                    continue;
                }

                if (oldBoxId === newBoxId) {
                    console.log(`Card ${cardId} remains in the same box (${newBoxId})`);
                    continue;
                }

                const card = this.cardsReadyForExport.get(cardId);
                if (card) {
                    this.cardsReadyForExport.set(cardId, { ...card, boxNumber: newBoxId });
                }
                
            }

            this.sessionResults = [];
            this.inSession = false;
        }
    }
});
