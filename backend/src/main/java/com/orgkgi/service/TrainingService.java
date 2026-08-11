package com.orgkgi.service;

import com.orgkgi.entity.Training;
import com.orgkgi.exception.TrainingNotFoundException;
import com.orgkgi.repository.TrainingRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TrainingService {

    private final TrainingRepository trainingRepository;

    public TrainingService(TrainingRepository trainingRepository) {
        this.trainingRepository = trainingRepository;
    }

    // Create Training
    public Training addTraining(Training training) {

        // Business Validation
        if (training.getEndDate().isBefore(training.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        return trainingRepository.save(training);
    }

    // Get All Trainings
    public List<Training> getAllTrainings() {
        return trainingRepository.findAll();
    }

    // Get Training By Id
    public Training getTrainingById(Long id) {

        return trainingRepository.findById(id)
                .orElseThrow(() ->
                        new TrainingNotFoundException(
                                "Training not found with id: " + id));
    }

    // Update Training
    public Training updateTraining(Long id, Training updatedTraining) {

        Training existingTraining = trainingRepository.findById(id)
                .orElseThrow(() ->
                        new TrainingNotFoundException(
                                "Training not found with id: " + id));

        // Business Validation
        if (updatedTraining.getEndDate().isBefore(updatedTraining.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        existingTraining.setTrainingName(updatedTraining.getTrainingName());
        existingTraining.setDescription(updatedTraining.getDescription());
        existingTraining.setStartDate(updatedTraining.getStartDate());
        existingTraining.setEndDate(updatedTraining.getEndDate());
        existingTraining.setTrainer(updatedTraining.getTrainer());

        return trainingRepository.save(existingTraining);
    }

    // Delete Training
    public void deleteTraining(Long id) {

        Training training = trainingRepository.findById(id)
                .orElseThrow(() ->
                        new TrainingNotFoundException(
                                "Training not found with id: " + id));

        trainingRepository.delete(training);
    }
}