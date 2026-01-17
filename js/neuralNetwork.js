import { clamp } from './utils.js';

export class NeuralNetwork {
    /**
     * Creates a new NeuralNetwork instance.
     * @param {number} inputNodes - Number of input neurons.
     * @param {number} hiddenNodes - Number of hidden neurons.
     * @param {number} outputNodes - Number of output neurons.
     */
    constructor(inputNodes, hiddenNodes, outputNodes) {
        this.inputNodes = inputNodes;
        this.hiddenNodes = hiddenNodes;
        this.outputNodes = outputNodes;

        // Initialize weights and biases randomly
        this.weights_ih = this.createRandomMatrix(this.inputNodes, this.hiddenNodes);
        this.bias_h = this.createRandomArray(this.hiddenNodes);

        this.weights_ho = this.createRandomMatrix(this.hiddenNodes, this.outputNodes);
        this.bias_o = this.createRandomArray(this.outputNodes);
    }

    /**
     * Creates a matrix with random values between -1 and 1.
     * @param {number} rows - Number of rows.
     * @param {number} cols - Number of columns.
     * @returns {number[][]} A new matrix.
     */
    createRandomMatrix(rows, cols) {
        return Array(rows).fill(0).map(() =>
            Array(cols).fill(0).map(() => (Math.random() - 0.5) * 2)
        );
    }

    /**
     * Creates an array with random values between -1 and 1.
     * @param {number} size - Size of the array.
     * @returns {number[]} A new array.
     */
    createRandomArray(size) {
        return Array(size).fill(0).map(() => (Math.random() - 0.5) * 2);
    }

    /**
     * Performs matrix multiplication (dot product).
     * @param {number[]} a - Input vector.
     * @param {number[][]} b - Weight matrix.
     * @returns {number[]} Resulting vector.
     */
    matrixMultiply(a, b) {
        const result = Array(b[0].length).fill(0);
        for (let j = 0; j < b[0].length; j++) {
            for (let i = 0; i < a.length; i++) {
                result[j] += a[i] * b[i][j];
            }
        }
        return result;
    }

    /**
     * ReLU activation function.
     * @param {number} x - Input value.
     * @returns {number} Activated value.
     */
    relu(x) { return Math.max(0, x); }

    /**
     * Tanh activation function.
     * @param {number} x - Input value.
     * @returns {number} Activated value.
     */
    tanh(x) { return Math.tanh(x); }

    /**
     * Feeds inputs through the neural network to get outputs.
     * @param {number[]} inputs - Array of normalized input values.
     * @returns {number[]} Array of output values.
     */
    feedForward(inputs) {
        // Hidden layer calculation
        let hidden = this.matrixMultiply(inputs, this.weights_ih);
        hidden = hidden.map((val, i) => this.relu(val + this.bias_h[i]));

        // Output layer calculation
        let outputs = this.matrixMultiply(hidden, this.weights_ho);
        outputs = outputs.map((val, i) => this.tanh(val + this.bias_o[i]));

        return outputs;
    }

    /**
     * Creates a new brain by cloning and mutating a parent's brain.
     * @param {NeuralNetwork} parentBrain - The brain of the parent.
     * @param {number} parentFitness - The fitness of the parent, used for adaptive mutation.
     * @param {number} mutationRate - The global mutation rate.
     * @param {number} mutationStrength - The global mutation strength.
     * @returns {NeuralNetwork} A new, mutated NeuralNetwork instance.
     */
    cloneAndMutate(parentBrain, parentFitness, mutationRate, mutationStrength) {
        const newBrain = new NeuralNetwork(this.inputNodes, this.hiddenNodes, this.outputNodes);

        // Helper to mutate a gene value
        const mutateGene = (gene, currentMutationStrength) => {
            if (Math.random() < mutationRate) {
                return gene + (Math.random() - 0.5) * currentMutationStrength * 2;
            }
            return gene;
        };

        let effectiveMutationStrength = mutationStrength;
        // Adaptive mutation strength based on parent's fitness
        if (parentFitness > 5000) { // Very fit parent, reduce mutation for "fine-tuning"
            effectiveMutationStrength *= 0.6;
        } else if (parentFitness < 1000) { // Less fit parent, increase mutation for "exploration"
            effectiveMutationStrength *= 1.4;
        }

        newBrain.weights_ih = parentBrain.weights_ih.map(row =>
            row.map(val => mutateGene(val, effectiveMutationStrength))
        );
        newBrain.bias_h = parentBrain.bias_h.map(val =>
            mutateGene(val, effectiveMutationStrength)
        );
        newBrain.weights_ho = parentBrain.weights_ho.map(row =>
            row.map(val => mutateGene(val, effectiveMutationStrength))
        );
        newBrain.bias_o = parentBrain.bias_o.map(val =>
            mutateGene(val, effectiveMutationStrength)
        );

        return newBrain;
    }

    /**
     * Performs uniform crossover between two parent brains.
     * @param {NeuralNetwork} brain1 - The first parent's brain.
     * @param {NeuralNetwork} brain2 - The second parent's brain.
     * @returns {NeuralNetwork} A new brain resulting from crossover.
     */
    static crossover(brain1, brain2) {
        const newBrain = new NeuralNetwork(brain1.inputNodes, brain1.hiddenNodes, brain1.outputNodes);

        // Helper to perform crossover on a gene array/matrix
        const doCrossover = (genes1, genes2, isMatrix = false) => {
            const offspringGenes = [];
            if (isMatrix) {
                for (let i = 0; i < genes1.length; i++) {
                    offspringGenes[i] = [];
                    for (let j = 0; j < genes1[i].length; j++) {
                        offspringGenes[i][j] = Math.random() < 0.5 ? genes1[i][j] : genes2[i][j];
                    }
                }
            } else {
                for (let i = 0; i < genes1.length; i++) {
                    offspringGenes[i] = Math.random() < 0.5 ? genes1[i] : genes2[i];
                }
            }
            return offspringGenes;
        };

        newBrain.weights_ih = doCrossover(brain1.weights_ih, brain2.weights_ih, true);
        newBrain.bias_h = doCrossover(brain1.bias_h, brain2.bias_h);
        newBrain.weights_ho = doCrossover(brain1.weights_ho, brain2.weights_ho, true);
        newBrain.bias_o = doCrossover(brain1.bias_o, brain2.bias_o);

        return newBrain;
    }
}
