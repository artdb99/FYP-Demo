<?php

// database/migrations/xxxx_xx_xx_add_physical_activity_to_patients_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('patients', function (Blueprint $table) {
            // keep it simple (string); we’ll restrict from UI
            $table->string('physical_activity', 32)->nullable()->after('weight_kg');
        });
    }

    public function down(): void {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn('physical_activity');
        });
    }
};

