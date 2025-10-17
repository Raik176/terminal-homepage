package com.example.mixin;

import gameManaging.GameManager;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(GameManager.class)
public class GameManagerMixin {
    @Inject(method = "init", at = @At("HEAD"))
    private static void init(CallbackInfo ci) {
        // This code is injected into the start of GameManager.init()V
    }
}