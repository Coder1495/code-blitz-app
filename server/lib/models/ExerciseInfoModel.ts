import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

const solutionSchema = new Schema({
    prologue: {
        type: String,
    },
    epilogue: {
        type: String,
    },
    solutionComparison: {
        type: String,
    },
})

const tokenSchema = new Schema({
    id: {
        type: String,
    },
    token: {
        type: String,
    },
    type: {
        type: String,
    },
    cost: {
        type: Number,
    },
})

export const ExerciseInfoSchema = new Schema({
    title: {
        type: String,
    },
    prompt: {
        type: String,
    },
    level: {
        type: Number,
    },
    availableBudget: {
        type: Number,
    },
    highBudget: {
        type: Number,
    },
    lowBudget: {
        type: Number,
    },
    estimatedTime: {
        type: Number,
    },
    solutions: [solutionSchema],
    tokens: [tokenSchema]
});