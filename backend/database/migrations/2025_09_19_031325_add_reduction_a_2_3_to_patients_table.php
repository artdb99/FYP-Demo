<?php

// database/migrations/XXXX_XX_XX_XXXXXX_add_reduction_a_2_3_to_patients_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            // same style as reduction_a (decimal is fine here)
            $table->decimal('reduction_a_2_3', 5, 2)->nullable()->after('reduction_a');
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn('reduction_a_2_3');
        });
    }
};
