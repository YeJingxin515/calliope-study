from typing import Callable

import gym
import numpy as np
from sb3_contrib.common.wrappers import ActionMasker

from app.model.embedding import CausalCNNEncoder
from rl.generator import StoryGenerator
from rl.stable import GymEnv
from rl.model.ppo_rnn_mask import MaskableRecurrentPPO, MaskableRecurrentActorCriticPolicy


def mask_fn(env: gym.Env) -> np.ndarray:
    return env.valid_action_mask()


def linear_schedule(initial_value: float) -> Callable[[float], float]:

    def func(progress_remaining: float) -> float:
        return progress_remaining * initial_value

    return func


hyperparameter = {
    "batch_size": 1,
    "channels": 30,
    "compared_length": 500,
    "depth": 10,
    "nb_steps": 300,
    "in_channels": 1,
    "kernel_size": 3,
    "lr": 0.0001,
    "nb_random_samples": 10,
    "negative_penalty": 1,
    "out_channels": 160,
    "reduced_size": 80,
    "cuda": False,
    "gpu": 0
}
embedding_model = CausalCNNEncoder()
embedding_model.set_params(**hyperparameter)

env = GymEnv()
env = ActionMasker(env, mask_fn)

story_model = MaskableRecurrentPPO(policy=MaskableRecurrentActorCriticPolicy,
                                   env=env,
                                   n_steps=1024,
                                   learning_rate=linear_schedule(0.001),
                                   verbose=1).load('rl3.zip')
story_model.env = env

generator = StoryGenerator(embedding_model=embedding_model, story_model=story_model)
# generator.load_embedding_model('.')
# generator.load_story_model('.')
