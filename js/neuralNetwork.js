import { clamp } from './utils.js';
import { SIM_CONFIG } from './constants.js'; // Import SIM_CONFIG

export class NeuralNetwork {
    /**
     * Creates a new NeuralNetwork instance.
     * @param {number} inputNodes - Number of input neurons.
     * @param {number} hiddenNodes - Number of hidden neurons.
     * @param {number} outputNodes - Number of output neurons.
     */
    constructor(inputNodes, hiddenNodes = SIM_CONFIG.MIN_BRAIN_HIDDEN_NODES, outputNodes) { // Default hiddenNodes
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
     * Creates a deep clone of the neural network.
     * @returns {NeuralNetwork} A new, identical NeuralNetwork instance.
     */
    clone() {
        const clonedBrain = new NeuralNetwork(this.inputNodes, this.hiddenNodes, this.outputNodes);
        clonedBrain.weights_ih = this.weights_ih.map(row => [...row]);
        clonedBrain.bias_h = [...this.bias_h];
        clonedBrain.weights_ho = this.weights_ho.map(row => [...row]);
        clonedBrain.bias_o = [...this.bias_o];
        return clonedBrain;
    }

    /**
     * Creates a new brain by cloning and mutating a parent's brain.
     * @param {NeuralNetwork} parentBrain - The brain of the parent.
     * @param {number} parentFitness - The fitness of the parent, used for adaptive mutation.
     * @param {number} mutationRate - The global mutation rate.
     * @param {number} mutationStrength - The global mutation strength.
     * @param {number} newHiddenNodes - The number of hidden nodes for the new brain.
     * @returns {NeuralNetwork} A new, mutated NeuralNetwork instance.
     */
    cloneAndMutate(parentBrain, parentFitness, mutationRate, mutationStrength, newHiddenNodes) {
        // Ensure newHiddenNodes is valid, default if not provided
        newHiddenNodes = newHiddenNodes !== undefined ? newHiddenNodes : parentBrain.hiddenNodes;
        
        const newBrain = new NeuralNetwork(parentBrain.inputNodes, newHiddenNodes, parentBrain.outputNodes);

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

        // Mutate weights and biases for layers that exist in both parent and new brain
        // For weights_ih
        for (let i = 0; i < Math.min(parentBrain.inputNodes, newBrain.inputNodes); i++) {
            for (let j = 0; j < Math.min(parentBrain.hiddenNodes, newBrain.hiddenNodes); j++) {
                newBrain.weights_ih[i][j] = mutateGene(parentBrain.weights_ih[i][j], effectiveMutationStrength);
            }
        }
        // For bias_h
        for (let i = 0; i < Math.min(parentBrain.hiddenNodes, newBrain.hiddenNodes); i++) {
            newBrain.bias_h[i] = mutateGene(parentBrain.bias_h[i], effectiveMutationStrength);
        }
        // For weights_ho
        for (let i = 0; i < Math.min(parentBrain.hiddenNodes, newBrain.hiddenNodes); i++) {
            for (let j = 0; j < Math.min(parentBrain.outputNodes, newBrain.outputNodes); j++) {
                newBrain.weights_ho[i][j] = mutateGene(parentBrain.weights_ho[i][j], effectiveMutationStrength);
            }
        }
        // For bias_o
        for (let i = 0; i < Math.min(parentBrain.outputNodes, newBrain.outputNodes); i++) {
            newBrain.bias_o[i] = mutateGene(parentBrain.bias_o[i], effectiveMutationStrength);
        }

        return newBrain;
    }

    /**
     * Performs uniform crossover between two parent brains.
     * @param {NeuralNetwork} brain1 - The first parent's brain.
     * @param {NeuralNetwork} brain2 - The second parent's brain.
     * @param {number} newHiddenNodes - The number of hidden nodes for the new brain.
     * @returns {NeuralNetwork} A new brain resulting from crossover.
     */
    static crossover(brain1, brain2, newHiddenNodes) {
        // Ensure newHiddenNodes is valid, default to the larger of the two parents if not provided
        newHiddenNodes = newHiddenNodes !== undefined ? newHiddenNodes : Math.max(brain1.hiddenNodes, brain2.hiddenNodes);

        const newBrain = new NeuralNetwork(brain1.inputNodes, newHiddenNodes, brain1.outputNodes);

        // Helper to perform crossover on a gene array/matrix
        const doCrossover = (genes1, genes2, isMatrix = false) => {
            const offspringGenes = [];
            if (isMatrix) {
                const rows = Math.max(genes1.length, genes2.length);
                const cols = Math.max(genes1[0].length, genes2[0].length); // Assuming all rows have same col count
                for (let i = 0; i < rows; i++) {
                    offspringGenes[i] = [];
                    for (let j = 0; j < cols; j++) {
                        const val1 = genes1[i] && genes1[i][j] !== undefined ? genes1[i][j] : (Math.random() - 0.5) * 2;
                        const val2 = genes2[i] && genes2[i][j] !== undefined ? genes2[i][j] : (Math.random() - 0.5) * 2;
                        offspringGenes[i][j] = Math.random() < 0.5 ? val1 : val2;
                    }
                }
            } else {
                const size = Math.max(genes1.length, genes2.length);
                for (let i = 0; i < size; i++) {
                    const val1 = genes1[i] !== undefined ? genes1[i] : (Math.random() - 0.5) * 2;
                    const val2 = genes2[i] !== undefined ? genes2[i] : (Math.random() - 0.5) * 2;
                    offspringGenes[i] = Math.random() < 0.5 ? val1 : val2;
                }
            }
            return offspringGenes;
        };

        // Perform crossover, adapting to potentially different hidden node counts
        newBrain.weights_ih = doCrossover(brain1.weights_ih, brain2.weights_ih, true);
        newBrain.bias_h = doCrossover(brain1.bias_h, brain2.bias_h);
        newBrain.weights_ho = doCrossover(brain1.weights_ho, brain2.weights_ho, true);
        newBrain.bias_o = doCrossover(brain1.bias_o, brain2.bias_o);

        return newBrain;
    }
}
