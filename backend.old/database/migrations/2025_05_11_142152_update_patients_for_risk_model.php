<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdatePatientsForRiskModel extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->float('hba1c_3rd_visit')->nullable();
            $table->float('gap_from_initial_visit')->nullable();
            $table->float('gap_from_first_clinical_visit')->nullable();
            $table->float('egfr')->nullable();
            $table->float('fvg_3')->nullable();
            $table->float('dds_1')->nullable();
            $table->float('dds_3')->nullable();
            $table->float('dds_trend_1_3')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->float('symptom_severity_before')->nullable();
            $table->float('symptom_severity_after')->nullable();
            $table->float('hypo_before')->nullable();
            $table->float('hypo_after')->nullable();

            $table->dropColumn([
                'hba1c_3rd_visit',
                'gap_from_initial_visit',
                'gap_from_first_clinical_visit',
                'egfr',
                'fvg_3',
                'dds_1',
                'dds_3',
                'dds_trend_1_3'
            ]);
        });
    }
}
