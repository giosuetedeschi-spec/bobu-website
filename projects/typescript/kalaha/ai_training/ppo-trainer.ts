import { KalahaEnv, type Observation } from "../training/kalaha-env";

export type PpoProfileName = "scaffold" | "v0" | "v1" | "v2";
export type PpoProfile = {
  totalTimesteps: number;
  iterations: number;
  environments: number;
  stepsPerEnvironment: number;
  batchSize: number;
  epochs: number;
  learningRate: number;
  gamma: number;
  gaeLambda: number;
  clipRange: number;
  valueCoefficient: number;
  entropyCoefficient: number;
};

export const PPO_PROFILES: Record<PpoProfileName, PpoProfile> = {
  scaffold: { totalTimesteps: 10_000, iterations: 1, environments: 1, stepsPerEnvironment: 2_048, batchSize: 64, epochs: 10, learningRate: 3e-4, gamma: 0.99, gaeLambda: 0.95, clipRange: 0.2, valueCoefficient: 0.5, entropyCoefficient: 0 },
  v0: { totalTimesteps: 50_000, iterations: 10, environments: 1, stepsPerEnvironment: 2_048, batchSize: 64, epochs: 10, learningRate: 3e-4, gamma: 0.99, gaeLambda: 0.95, clipRange: 0.2, valueCoefficient: 0.5, entropyCoefficient: 0 },
  v1: { totalTimesteps: 50_000, iterations: 40, environments: 1, stepsPerEnvironment: 4_096, batchSize: 256, epochs: 10, learningRate: 1e-4, gamma: 0.995, gaeLambda: 0.98, clipRange: 0.2, valueCoefficient: 0.5, entropyCoefficient: 0.01 },
  v2: { totalTimesteps: 100_000, iterations: 20, environments: 8, stepsPerEnvironment: 256, batchSize: 512, epochs: 10, learningRate: 3e-4, gamma: 0.995, gaeLambda: 0.98, clipRange: 0.2, valueCoefficient: 0.5, entropyCoefficient: 0.01 },
};

type Sample = {
  observation: Observation;
  nextObservation: Observation;
  mask: boolean[];
  action: number;
  oldLogProbability: number;
  reward: number;
  terminal: boolean;
  extraTurn: boolean;
  value: number;
  advantage: number;
  targetValue: number;
};

export type LinearPolicy = { weights: number[][]; bias: number[]; valueWeights: number[]; valueBias: number };
export type TrainedPpo = { profile: PpoProfileName; policy: LinearPolicy; updates: number; samples: number };

function randomGenerator(seed: number) {
  let state = seed >>> 0;
  return () => { state = (state * 1_664_525 + 1_013_904_223) >>> 0; return state / 0x1_0000_0000; };
}

function features(observation: Observation): number[] {
  return observation.map((value, index) => index === 14 ? value : value / 48);
}

function softmax(logits: number[], mask: boolean[]): number[] {
  const legal = logits.map((value, index) => mask[index] ? value : Number.NEGATIVE_INFINITY);
  const maximum = Math.max(...legal);
  if (!Number.isFinite(maximum)) return logits.map(() => 0);
  const exponents = legal.map((value) => Number.isFinite(value) ? Math.exp(value - maximum) : 0);
  const total = exponents.reduce((sum, value) => sum + value, 0);
  return exponents.map((value) => value / total);
}

function logitsFor(policy: LinearPolicy, observation: Observation): number[] {
  const input = features(observation);
  return policy.weights.map((row, action) => row.reduce((sum, weight, index) => sum + weight * input[index], policy.bias[action]));
}

function valueFor(policy: LinearPolicy, observation: Observation): number {
  return features(observation).reduce((sum, value, index) => sum + value * policy.valueWeights[index], policy.valueBias);
}

function chooseAction(probabilities: number[], random: () => number): number {
  let roll = random();
  for (let action = 0; action < probabilities.length; action++) {
    roll -= probabilities[action];
    if (roll <= 0) return action;
  }
  for (let action = probabilities.length - 1; action >= 0; action--) if (probabilities[action] > 0) return action;
  return -1;
}

function initializePolicy(random: () => number): LinearPolicy {
  const inputSize = 15;
  const weights = Array.from({ length: 6 }, () => Array.from({ length: inputSize }, () => (random() - 0.5) * 0.04));
  return { weights, bias: Array(6).fill(0), valueWeights: Array.from({ length: inputSize }, () => (random() - 0.5) * 0.04), valueBias: 0 };
}

function finishAdvantages(samples: Sample[], profile: PpoProfile, policy: LinearPolicy) {
  let advantage = 0;
  for (let index = samples.length - 1; index >= 0; index--) {
    const sample = samples[index];
    const sign = sample.extraTurn ? 1 : -1;
    const nextValue = sample.terminal ? 0 : valueFor(policy, sample.nextObservation);
    const delta = sample.reward + profile.gamma * sign * nextValue - sample.value;
    advantage = delta + (sample.terminal ? 0 : profile.gamma * profile.gaeLambda * sign * advantage);
    sample.advantage = advantage;
    sample.targetValue = advantage + sample.value;
  }
}

function trainBatch(samples: Sample[], profile: PpoProfile, policy: LinearPolicy, random: () => number) {
  const mean = samples.reduce((sum, sample) => sum + sample.advantage, 0) / Math.max(1, samples.length);
  const variance = samples.reduce((sum, sample) => sum + (sample.advantage - mean) ** 2, 0) / Math.max(1, samples.length);
  const deviation = Math.sqrt(variance) || 1;
  for (const sample of samples) sample.advantage = (sample.advantage - mean) / deviation;

  for (let epoch = 0; epoch < profile.epochs; epoch++) {
    const order = samples.map((_, index) => index);
    for (let index = order.length - 1; index > 0; index--) {
      const other = Math.floor(random() * (index + 1));
      [order[index], order[other]] = [order[other], order[index]];
    }
    for (let start = 0; start < order.length; start += profile.batchSize) {
      for (const sampleIndex of order.slice(start, start + profile.batchSize)) {
        const sample = samples[sampleIndex];
        const input = features(sample.observation);
        const probabilities = softmax(logitsFor(policy, sample.observation), sample.mask);
        const chosen = probabilities[sample.action];
        if (chosen <= 0) continue;
        const ratio = Math.exp(Math.log(chosen) - sample.oldLogProbability);
        const clipped = ratio < 1 - profile.clipRange || ratio > 1 + profile.clipRange;
        const directionClipped = clipped && ((sample.advantage > 0 && ratio > 1 + profile.clipRange) || (sample.advantage < 0 && ratio < 1 - profile.clipRange));
        const entropy = -probabilities.reduce((sum, probability) => probability > 0 ? sum + probability * Math.log(probability) : sum, 0);
        if (!directionClipped) {
          for (let action = 0; action < 6; action++) {
            const policyGradient = sample.advantage * ratio * ((action === sample.action ? 1 : 0) - probabilities[action]);
            const entropyGradient = probabilities[action] > 0 ? -probabilities[action] * (Math.log(probabilities[action]) + entropy) : 0;
            const gradient = profile.learningRate * (policyGradient + profile.entropyCoefficient * entropyGradient);
            policy.bias[action] += gradient;
            for (let feature = 0; feature < input.length; feature++) policy.weights[action][feature] += gradient * input[feature];
          }
        }
        const error = sample.targetValue - valueFor(policy, sample.observation);
        const valueScale = profile.learningRate * profile.valueCoefficient * error;
        policy.valueBias += valueScale;
        for (let feature = 0; feature < input.length; feature++) policy.valueWeights[feature] += valueScale * input[feature];
      }
    }
  }
}

export function trainPpo(
  name: PpoProfileName = "scaffold",
  options: { iterations?: number; stepsPerEnvironment?: number; environments?: number; rolloutCycles?: number; seed?: number } = {},
): TrainedPpo {
  const profile = { ...PPO_PROFILES[name], ...options };
  const random = randomGenerator(options.seed ?? 42);
  const policy = initializePolicy(random);
  let sampleCount = 0;

  for (let iteration = 0; iteration < profile.iterations; iteration++) {
    const rolloutCycles = options.rolloutCycles ?? Math.max(1, Math.ceil(profile.totalTimesteps / (profile.stepsPerEnvironment * profile.environments)));
    for (let cycle = 0; cycle < rolloutCycles; cycle++) {
      const rollout: Sample[] = [];
      for (let environmentIndex = 0; environmentIndex < profile.environments; environmentIndex++) {
        const env = new KalahaEnv();
        let observation = env.reset();
        let segment: Sample[] = [];
        for (let step = 0; step < profile.stepsPerEnvironment; step++) {
          const mask = env.actionMask();
          const probabilities = softmax(logitsFor(policy, observation), mask);
          const action = chooseAction(probabilities, random);
          if (action < 0) break;
          const value = valueFor(policy, observation);
          const result = env.step(action);
          const sample: Sample = { observation, nextObservation: result.observation, mask, action, oldLogProbability: Math.log(probabilities[action]), reward: result.reward, terminal: result.terminated, extraTurn: result.extraTurn, value, advantage: 0, targetValue: 0 };
          segment.push(sample);
          observation = result.observation;
          if (result.terminated || result.truncated) {
            finishAdvantages(segment, profile, policy);
            rollout.push(...segment);
            segment = [];
            observation = env.reset();
          }
        }
        finishAdvantages(segment, profile, policy);
        rollout.push(...segment);
      }
      trainBatch(rollout, profile, policy, random);
      sampleCount += rollout.length;
    }
  }

  return { profile: name, policy, updates: profile.iterations, samples: sampleCount };
}

export function predictPpo(policy: LinearPolicy, observation: Observation, mask: boolean[], deterministic = true, random = Math.random): number | null {
  const probabilities = softmax(logitsFor(policy, observation), mask);
  if (!probabilities.some((probability) => probability > 0)) return null;
  if (deterministic) return probabilities.indexOf(Math.max(...probabilities));
  return chooseAction(probabilities, random);
}
