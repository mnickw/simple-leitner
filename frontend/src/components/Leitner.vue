<template>
    <div class="max-w-2xl mx-auto py-10 px-4">
        <h1 class="text-3xl font-bold mb-6 text-center">Leitner Flashcards</h1>

        <!-- Box Stats -->
        <div v-if="!store.inSession" class="grid grid-cols-3 gap-4 mb-6">
            <div
                v-for="(count, boxNumber) in boxStats"
                :key="boxNumber"
                class="bg-white rounded shadow p-4 text-center"
            >
                <h2 class="text-lg font-semibold">Box {{ boxNumber }}</h2>
                <p class="text-gray-600">{{ count }} cards</p>
            </div>
        </div>

        <!-- Add Card -->
        <div v-if="!store.inSession" class="mb-6 space-y-2">
            <input v-model="front" placeholder="Front" class="input" />
            <input v-model="back" placeholder="Back" class="input" />
            <button class="btn btn-blue" @click="addCard">Add</button>
        </div>

        <!-- Import / Export -->
        <div v-if="!store.inSession" class="flex items-center gap-3 mb-6">
            <!-- Hidden file input -->
            <input
                ref="importInput"
                type="file"
                accept=".json"
                class="hidden"
                @change="onImport"
            />
            <!-- Trigger file input -->
            <button class="btn btn-gray" @click="triggerImport">Import</button>

            <button class="btn btn-gray" @click="onExport">Export</button>
        </div>


        <!-- Start Session -->
        <div v-if="!store.inSession">
            <button class="btn btn-green" @click="store.startSession()">Start Session</button>
        </div>

        <!-- Session View -->
        <div v-else>
            <div v-if="currentCard" class="bg-yellow-100 p-4 rounded shadow mb-4">
                <div class="text-lg font-semibold">{{ currentCard.front }}</div>

                <div v-if="revealed" class="mt-2 text-gray-700">
                    {{ currentCard.boxNumber }}
                </div>

                <div v-if="revealed" class="mt-2 text-gray-700">
                    {{ currentCard.back }}
                </div>

                <div v-else class="mt-2">
                    <button class="btn btn-gray" @click="revealed = true">Show Answer</button>
                </div>
            </div>

            <div v-if="currentCard" class="flex gap-2 mb-4">
                <button class="btn btn-red" @click="answer(1)">Put in Box 1</button>
                <button class="btn btn-red" @click="answer(currentBoxNumber - 1)">Put in previous box</button>
                <button class="btn btn-blue" @click="answer(currentBoxNumber + 1)">Put in next box</button>
                <select v-model.number="customBox" class="input w-24">
                    <option v-for="n in 10" :key="n" :value="n">Box {{ n }}</option>
                </select>
                <button class="btn btn-indigo" @click="answer(customBox)">Custom Box</button>
            </div>

            <button class="btn btn-gray" @click="store.endSession()">End Session</button>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useLeitnerStore } from '@/stores/LeitnerStore';
import type { Card } from '@/models/Card';

const store = useLeitnerStore();
const front = ref('');
const back = ref('');
const customBox = ref(1);

const addCard = () => {
    if (!front.value || !back.value) return;

    const card: Card = {
        id: crypto.randomUUID(),
        front: front.value,
        back: back.value,
        boxNumber: 1
    };

    store.addCard(card);
    front.value = '';
    back.value = '';
};

const importInput = ref<HTMLInputElement | null>(null);

const triggerImport = () => {
    importInput.value?.click();
};

const onImport = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        const content = reader.result as string;
        store.importFile(content);
    };
    reader.readAsText(file);
};

const onExport = () => {
    const blob = new Blob([store.exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'leitner_cards.json';
    link.click();
};

const allCards = computed(() => Array.from(store.cards.values()));

const boxStats = computed(() => {
    const stats: Record<number, number> = {};
    for (const card of allCards.value) {
        stats[card.boxNumber] = (stats[card.boxNumber] || 0) + 1;
    }
    return stats;
});

const sessionQueue = computed(() => {
    return allCards.value.sort((a, b) => a.boxNumber - b.boxNumber)
        .filter(c => !store.sessionResults.find(r => r.cardId === c.id));
});

const currentCard = computed(() => sessionQueue.value[0] || null);
const currentBoxNumber = computed(() => currentCard.value?.boxNumber ?? 1);

const answer = (boxId: number) => {
    if (currentCard.value) {
        store.answerCard(currentCard.value.id, boxId);
    }
};

const revealed = ref(false);

watch(currentCard, () => {
    revealed.value = false;
});

</script>

<style scoped>
@reference "tailwindcss";
.input {
    @apply border rounded px-3 py-1 w-full;
}
.btn {
    @apply px-4 py-2 rounded text-white;
}
.btn-blue {
    @apply bg-blue-500 hover:bg-blue-600;
}
.btn-red {
    @apply bg-red-500 hover:bg-red-600;
}
.btn-green {
    @apply bg-green-500 hover:bg-green-600;
}
.btn-gray {
    @apply bg-gray-600 hover:bg-gray-700;
}
.btn-indigo {
    @apply bg-indigo-500 hover:bg-indigo-600;
}
</style>
