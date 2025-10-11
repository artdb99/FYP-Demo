<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('messages')) {
            // Table already exists (e.g., from a previous partial run). Skip.
            return;
        }
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('patient_id');
            $table->unsignedBigInteger('doctor_id');
            $table->enum('sender_type', ['doctor', 'patient']);
            $table->text('body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['patient_id', 'doctor_id']);
            $table->index(['patient_id', 'created_at']);
            // Keep patient FK; drop doctor FK to avoid type mismatch with existing users.id
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
