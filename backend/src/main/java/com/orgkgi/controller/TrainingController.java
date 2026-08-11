package com.orgkgi.controller;

import com.orgkgi.entity.Training;
import com.orgkgi.service.TrainingService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/trainings")
public class TrainingController {

    private final TrainingService trainingService;

    public TrainingController(TrainingService trainingService) {
        this.trainingService = trainingService;
    }

    @GetMapping
    public List<Training> getAllTrainings() {
        return trainingService.getAllTrainings();
    }

    @GetMapping("/{id}")
    public Training getTrainingById(@PathVariable Long id) {
        return trainingService.getTrainingById(id);
    }

    @PostMapping
    public Training addTraining(@Valid @RequestBody Training training) {
        return trainingService.addTraining(training);
    }

    @PutMapping("/{id}")
    public Training updateTraining(@PathVariable Long id,
                                   @Valid @RequestBody Training training) {
        return trainingService.updateTraining(id, training);
    }

    @DeleteMapping("/{id}")
    public String deleteTraining(@PathVariable Long id) {
        trainingService.deleteTraining(id);
        return "Training deleted successfully";
    }
}