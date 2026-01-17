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
        this.id = Math.random().toString(36).substring(2, 9); // Unique ID for debugging
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
        if (rows <= 0 || cols <= 0) return []; // Handle zero or negative dimensions gracefully
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
        if (size <= 0) return []; // Handle zero or negative dimensions gracefully
        return Array(size).fill(0).map(() => (Math.random() - 0.5) * 2);
    }

    /**
     * Performs matrix multiplication (dot product).
     * @param {number[]} a - Input vector.
     * @param {number[][]} b - Weight matrix.
     * @returns {number[]} Resulting vector.
     */
    matrixMultiply(a, b) {
        if (a.length === 0 || b.length === 0 || b[0].length === 0) return Array(b[0] ? b[0].length : 0).fill(0); // Handle empty inputs
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
        if (this.hiddenNodes <= 0) { // If no hidden layer, directly connect input to output (simplified)
            // This is a very basic direct connection, not a proper NN without hidden layer.
            // For a real NN, you'd need a different architecture. Here, we'll just output zeros.
            // Or, you could adapt weights_ih to be weights_io. For simplicity, we'll output neutral.
            return Array(this.outputNodes).fill(0.5); 
        }

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
     * Handles dynamic hidden node count.
     * @param {NeuralNetwork} parentBrain - The brain of the parent.
     * @param {number} parentFitness - The fitness of the parent, used for adaptive mutation.
     * @param {number} mutationRate - The global mutation rate.
     * @param {number} mutationStrength - The global mutation strength.
     * @param {number} targetHiddenNodes - The desired number of hidden nodes for the new brain.
     * @returns {NeuralNetwork} A new, mutated NeuralNetwork instance.
     */
    cloneAndMutate(parentBrain, parentFitness, mutationRate, mutationStrength, targetHiddenNodes) {
        targetHiddenNodes = clamp(targetHiddenNodes, SIM_CONFIG.MIN_BRAIN_HIDDEN_NODES, SIM_CONFIG.MAX_BRAIN_HIDDEN_NODES);
        
        const newBrain = new NeuralNetwork(parentBrain.inputNodes, targetHiddenNodes, parentBrain.outputNodes);

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

        // Mutate existing weights and biases, and initialize new ones if hidden nodes increased
        // Weights_ih (input to hidden)
        for (let i = 0; i < newBrain.inputNodes; i++) {
            for (let j = 0; j < newBrain.hiddenNodes; j++) {
                if (i < parentBrain.inputNodes && j < parentBrain.hiddenNodes) {
                    newBrain.weights_ih[i][j] = mutateGene(parentBrain.weights_ih[i][j], effectiveMutationStrength);
                } else {
                    newBrain.weights_ih[i][j] = mutateGene((Math.random() - 0.5) * 2, effectiveMutationStrength); // Initialize new weights
                }
            }
        }

        // Bias_h (hidden layer biases)
        for (let i = 0; i < newBrain.hiddenNodes; i++) {
            if (i < parentBrain.hiddenNodes) {
                newBrain.bias_h[i] = mutateGene(parentBrain.bias_h[i], effectiveMutationStrength);
            } else {
                newBrain.bias_h[i] = mutateGene((Math.random() - 0.5) * 2, effectiveMutationStrength); // Initialize new biases
            }
        }

        // Weights_ho (hidden to output)
        for (let i = 0; i < newBrain.hiddenNodes; i++) {
            for (let j = 0; j < newBrain.outputNodes; j++) {
                if (i < parentBrain.hiddenNodes && j < parentBrain.outputNodes) {
                    newBrain.weights_ho[i][j] = mutateGene(parentBrain.weights_ho[i][j], effectiveMutationStrength);
                } else {
                    newBrain.weights_ho[i][j] = mutateGene((Math.random() - 0.5) * 2, effectiveMutationStrength); // Initialize new weights
                }
            }
        }

        // Bias_o (output layer biases) - Output nodes count is fixed, so just mutate existing
        for (let i = 0; i < newBrain.outputNodes; i++) {
            newBrain.bias_o[i] = mutateGene(parentBrain.bias_o[i], effectiveMutationStrength);
        }

        return newBrain;
    }

    /**
     * Performs uniform crossover between two parent brains.
     * Handles dynamic hidden node count.
     * @param {NeuralNetwork} brain1 - The first parent's brain.
     * @param {NeuralNetwork} brain2 - The second parent's brain.
     * @param {number} targetHiddenNodes - The desired number of hidden nodes for the new brain.
     * @returns {NeuralNetwork} A new brain resulting from crossover.
     */
    static crossover(brain1, brain2, targetHiddenNodes) {
        targetHiddenNodes = clamp(targetHiddenNodes, SIM_CONFIG.MIN_BRAIN_HIDDEN_NODES, SIM_CONFIG.MAX_BRAIN_HIDDEN_NODES);

        const newBrain = new NeuralNetwork(brain1.inputNodes, targetHiddenNodes, brain1.outputNodes);

        // Helper to perform crossover on a gene array/matrix
        const doCrossover = (genes1, genes2, newSize, isMatrix = false) => {
            const offspringGenes = [];
            if (isMatrix) {
                const rows = newBrain.inputNodes; // For weights_ih, use newBrain's inputNodes
                const cols = newSize; // For weights_ih/ho, use targetHiddenNodes or outputNodes

                for (let i = 0; i < rows; i++) {
                    offspringGenes[i] = [];
                    for (let j = 0; j < cols; j++) {
                        const val1 = (genes1[i] && genes1[i][j] !== undefined) ? genes1[i][j] : (Math.random() - 0.5) * 2;
                        const val2 = (genes2[i] && genes2[i][j] !== undefined) ? genes2[i][j] : (Math.random() - 0.5) * 2;
                        offspringGenes[i][j] = Math.random() < 0.5 ? val1 : val2;
                    }
                }
            } else { // For biases
                const size = newSize;
                for (let i = 0; i < size; i++) {
                    const val1 = genes1[i] !== undefined ? genes1[i] : (Math.random() - 0.5) * 2;
                    const val2 = genes2[i] !== undefined ? genes2[i] : (Math.random() - 0.5) * 2;
                    offspringGenes[i] = Math.random() < 0.5 ? val1 : val2;
                }
            }
            return offspringGenes;
        };

        // Perform crossover, adapting to target hidden node count
        newBrain.weights_ih = doCrossover(brain1.weights_ih, brain2.weights_ih, newBrain.hiddenNodes, true);
        newBrain.bias_h = doCrossover(brain1.bias_h, brain2.bias_h, newBrain.hiddenNodes);
        newBrain.weights_ho = doCrossover(brain1.weights_ho, brain2.weights_ho, newBrain.outputNodes, true); // Hidden to output, use newBrain's hiddenNodes as rows
        newBrain.bias_o = doCrossover(brain1.bias_o, brain2.bias_o, newBrain.outputNodes);

        return newBrain;
    }
}
