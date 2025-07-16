import pandas as pd
import sqlite3
import numpy as np
import os
from pathlib import Path

class RoadDataIngester:
    def __init__(self, csv_file_path, db_path):
        self.csv_file_path = csv_file_path
        self.db_path = db_path
        
    def load_csv_data(self):
        """Load and clean the CSV data"""
        print("Loading CSV data...")
        
        # Read the CSV file, skipping the first row with lane headers
        df = pd.read_csv(self.csv_file_path, skiprows=1)
        
        # Clean column names by removing spaces and special characters
        df.columns = [col.strip() for col in df.columns]
        
        print(f"Loaded {len(df)} rows of data")
        return df
    
    def calculate_quality_scores(self, df):
        """Calculate quality scores based on road condition metrics"""
        print("Calculating quality scores...")
        
        # Define scoring functions for each parameter
        def roughness_score(bi_value, limit=2400):
            """Higher BI values are worse, so score decreases as BI increases"""
            if pd.isna(bi_value) or bi_value == 0:
                return 0.5  # Default for missing data
            # Normalize: excellent (0-800), good (800-1200), fair (1200-1800), poor (1800-2400), very poor (>2400)
            score = max(0, min(1, (limit - bi_value) / limit))
            return score
        
        def rut_score(rut_value, limit=5):
            """Lower rut depth is better"""
            if pd.isna(rut_value) or rut_value == 0:
                return 0.5  # Default for missing data
            score = max(0, min(1, (limit - rut_value) / limit))
            return score
        
        def crack_score(crack_value, limit=5):
            """Lower crack percentage is better"""
            if pd.isna(crack_value) or crack_value == 0:
                return 1.0  # No cracks is perfect
            score = max(0, min(1, (limit - crack_value) / limit))
            return score
        
        def ravelling_score(ravelling_value, limit=1):
            """Lower ravelling percentage is better"""
            if pd.isna(ravelling_value) or ravelling_value == 0:
                return 1.0  # No ravelling is perfect
            score = max(0, min(1, (limit - ravelling_value) / limit))
            return score
        
        # Calculate average values for each parameter
        roughness_cols = [f'L{i} Lane Roughness BI (in mm/km)' for i in range(1, 5)] + [f'R{i} Lane Roughness BI (in mm/km)' for i in range(1, 5)]
        rut_cols = [f'L{i} Rut Depth (in mm)' for i in range(1, 5)] + [f'R{i} Rut Depth (in mm)' for i in range(1, 5)]
        crack_cols = [f'L{i} Crack Area (in % area)' for i in range(1, 5)] + [f'R{i} Crack Area (in % area)' for i in range(1, 5)]
        ravelling_cols = [f'L{i} Area (% area)' for i in range(1, 5)] + [f'R{i} Area (% area)' for i in range(1, 5)]
        
        # Calculate averages (handling missing values)
        df['avg_roughness_bi'] = df[roughness_cols].mean(axis=1, skipna=True)
        df['avg_rut_depth'] = df[rut_cols].mean(axis=1, skipna=True)
        df['avg_crack_area'] = df[crack_cols].mean(axis=1, skipna=True)
        df['avg_ravelling_area'] = df[ravelling_cols].mean(axis=1, skipna=True)
        
        # Calculate left and right averages
        left_roughness_cols = [f'L{i} Lane Roughness BI (in mm/km)' for i in range(1, 5)]
        right_roughness_cols = [f'R{i} Lane Roughness BI (in mm/km)' for i in range(1, 5)]
        left_rut_cols = [f'L{i} Rut Depth (in mm)' for i in range(1, 5)]
        right_rut_cols = [f'R{i} Rut Depth (in mm)' for i in range(1, 5)]
        left_crack_cols = [f'L{i} Crack Area (in % area)' for i in range(1, 5)]
        right_crack_cols = [f'R{i} Crack Area (in % area)' for i in range(1, 5)]
        left_ravelling_cols = [f'L{i} Area (% area)' for i in range(1, 5)]
        right_ravelling_cols = [f'R{i} Area (% area)' for i in range(1, 5)]
        
        df['left_avg_roughness_bi'] = df[left_roughness_cols].mean(axis=1, skipna=True)
        df['right_avg_roughness_bi'] = df[right_roughness_cols].mean(axis=1, skipna=True)
        df['left_avg_rut_depth'] = df[left_rut_cols].mean(axis=1, skipna=True)
        df['right_avg_rut_depth'] = df[right_rut_cols].mean(axis=1, skipna=True)
        df['left_avg_crack_area'] = df[left_crack_cols].mean(axis=1, skipna=True)
        df['right_avg_crack_area'] = df[right_crack_cols].mean(axis=1, skipna=True)
        df['left_avg_ravelling_area'] = df[left_ravelling_cols].mean(axis=1, skipna=True)
        df['right_avg_ravelling_area'] = df[right_ravelling_cols].mean(axis=1, skipna=True)
        
        # Calculate quality scores
        df['avg_roughness_score'] = df['avg_roughness_bi'].apply(roughness_score)
        df['avg_rut_score'] = df['avg_rut_depth'].apply(rut_score)
        df['avg_crack_score'] = df['avg_crack_area'].apply(crack_score)
        df['avg_ravelling_score'] = df['avg_ravelling_area'].apply(ravelling_score)
        
        # Calculate left and right scores
        df['left_roughness_score'] = df['left_avg_roughness_bi'].apply(roughness_score)
        df['right_roughness_score'] = df['right_avg_roughness_bi'].apply(roughness_score)
        df['left_rut_score'] = df['left_avg_rut_depth'].apply(rut_score)
        df['right_rut_score'] = df['right_avg_rut_depth'].apply(rut_score)
        df['left_crack_score'] = df['left_avg_crack_area'].apply(crack_score)
        df['right_crack_score'] = df['right_avg_crack_area'].apply(crack_score)
        df['left_ravelling_score'] = df['left_avg_ravelling_area'].apply(ravelling_score)
        df['right_ravelling_score'] = df['right_avg_ravelling_area'].apply(ravelling_score)
        
        # Calculate overall quality scores (weighted average)
        # Weights: roughness=40%, rut=30%, crack=20%, ravelling=10%
        weights = [0.4, 0.3, 0.2, 0.1]
        
        df['overall_quality_score'] = (
            df['avg_roughness_score'] * weights[0] +
            df['avg_rut_score'] * weights[1] +
            df['avg_crack_score'] * weights[2] +
            df['avg_ravelling_score'] * weights[3]
        )
        
        df['left_half_quality_score'] = (
            df['left_roughness_score'] * weights[0] +
            df['left_rut_score'] * weights[1] +
            df['left_crack_score'] * weights[2] +
            df['left_ravelling_score'] * weights[3]
        )
        
        df['right_half_quality_score'] = (
            df['right_roughness_score'] * weights[0] +
            df['right_rut_score'] * weights[1] +
            df['right_crack_score'] * weights[2] +
            df['right_ravelling_score'] * weights[3]
        )
        
        print("Quality scores calculated successfully")
        return df
    
    def create_processed_dataframe(self, df):
        """Create the final dataframe with proper column mapping"""
        print("Creating processed dataframe...")
        
        # Create a new dataframe with the required structure
        processed_df = pd.DataFrame()
        
        # Basic road information
        processed_df['nh_number'] = df['NH Number']
        processed_df['start_chainage'] = pd.to_numeric(df['Start Chainage'], errors='coerce')
        processed_df['end_chainage'] = pd.to_numeric(df['End Chainage'], errors='coerce')
        processed_df['length'] = pd.to_numeric(df['Length'], errors='coerce')
        processed_df['structure_details'] = df['Structure Details']
        processed_df['remark'] = df['Remark']
        
        # Lane coordinates - L1 (Left Lane 1)
        processed_df['l1_start_latitude'] = pd.to_numeric(df.iloc[:, 5], errors='coerce')  # First lat column
        processed_df['l1_start_longitude'] = pd.to_numeric(df.iloc[:, 6], errors='coerce')  # First lng column
        processed_df['l1_end_latitude'] = pd.to_numeric(df.iloc[:, 7], errors='coerce')
        processed_df['l1_end_longitude'] = pd.to_numeric(df.iloc[:, 8], errors='coerce')
        
        # L2, L3, L4 coordinates
        processed_df['l2_start_latitude'] = pd.to_numeric(df.iloc[:, 9], errors='coerce')
        processed_df['l2_start_longitude'] = pd.to_numeric(df.iloc[:, 10], errors='coerce')
        processed_df['l2_end_latitude'] = pd.to_numeric(df.iloc[:, 11], errors='coerce')
        processed_df['l2_end_longitude'] = pd.to_numeric(df.iloc[:, 12], errors='coerce')
        
        processed_df['l3_start_latitude'] = pd.to_numeric(df.iloc[:, 13], errors='coerce')
        processed_df['l3_start_longitude'] = pd.to_numeric(df.iloc[:, 14], errors='coerce')
        processed_df['l3_end_latitude'] = pd.to_numeric(df.iloc[:, 15], errors='coerce')
        processed_df['l3_end_longitude'] = pd.to_numeric(df.iloc[:, 16], errors='coerce')
        
        processed_df['l4_start_latitude'] = pd.to_numeric(df.iloc[:, 17], errors='coerce')
        processed_df['l4_start_longitude'] = pd.to_numeric(df.iloc[:, 18], errors='coerce')
        processed_df['l4_end_latitude'] = pd.to_numeric(df.iloc[:, 19], errors='coerce')
        processed_df['l4_end_longitude'] = pd.to_numeric(df.iloc[:, 20], errors='coerce')
        
        # R1, R2, R3, R4 coordinates (right lanes)
        processed_df['r1_start_latitude'] = pd.to_numeric(df.iloc[:, 21], errors='coerce')
        processed_df['r1_start_longitude'] = pd.to_numeric(df.iloc[:, 22], errors='coerce')
        processed_df['r1_end_latitude'] = pd.to_numeric(df.iloc[:, 23], errors='coerce')
        processed_df['r1_end_longitude'] = pd.to_numeric(df.iloc[:, 24], errors='coerce')
        
        processed_df['r2_start_latitude'] = pd.to_numeric(df.iloc[:, 25], errors='coerce')
        processed_df['r2_start_longitude'] = pd.to_numeric(df.iloc[:, 26], errors='coerce')
        processed_df['r2_end_latitude'] = pd.to_numeric(df.iloc[:, 27], errors='coerce')
        processed_df['r2_end_longitude'] = pd.to_numeric(df.iloc[:, 28], errors='coerce')
        
        processed_df['r3_start_latitude'] = pd.to_numeric(df.iloc[:, 29], errors='coerce')
        processed_df['r3_start_longitude'] = pd.to_numeric(df.iloc[:, 30], errors='coerce')
        processed_df['r3_end_latitude'] = pd.to_numeric(df.iloc[:, 31], errors='coerce')
        processed_df['r3_end_longitude'] = pd.to_numeric(df.iloc[:, 32], errors='coerce')
        
        processed_df['r4_start_latitude'] = pd.to_numeric(df.iloc[:, 33], errors='coerce')
        processed_df['r4_start_longitude'] = pd.to_numeric(df.iloc[:, 34], errors='coerce')
        processed_df['r4_end_latitude'] = pd.to_numeric(df.iloc[:, 35], errors='coerce')
        processed_df['r4_end_longitude'] = pd.to_numeric(df.iloc[:, 36], errors='coerce')
        
        # Limitations and thresholds
        processed_df['limitation_of_bi_as_per_morth_circular_in_mm_km'] = pd.to_numeric(df['Limitation of BI as per MoRT&H Circular (in mm/km)'], errors='coerce')
        processed_df['limitation_of_rut_depth_as_per_concession_agreement_in_mm'] = pd.to_numeric(df['Limitation of Rut Depth as per Concession Agreement (in mm)'], errors='coerce')
        processed_df['limitation_of_cracking_as_per_concession_agreement_in_area'] = pd.to_numeric(df['Limitation of Cracking as per Concession Agreement (in % area)'], errors='coerce')
        processed_df['limitation_of_ravelling_as_per_concession_agreement_in_area'] = pd.to_numeric(df['Limitation of Ravelling as per Concession Agreement (in % area)'], errors='coerce')
        
        # Individual lane measurements
        for i in range(1, 5):
            # Roughness BI
            processed_df[f'l{i}_lane_roughness_bi_in_mm_km'] = pd.to_numeric(df[f'L{i} Lane Roughness BI (in mm/km)'], errors='coerce')
            processed_df[f'r{i}_lane_roughness_bi_in_mm_km'] = pd.to_numeric(df[f'R{i} Lane Roughness BI (in mm/km)'], errors='coerce')
            
            # Rut depth
            processed_df[f'l{i}_rut_depth_in_mm'] = pd.to_numeric(df[f'L{i} Rut Depth (in mm)'], errors='coerce')
            processed_df[f'r{i}_rut_depth_in_mm'] = pd.to_numeric(df[f'R{i} Rut Depth (in mm)'], errors='coerce')
            
            # Crack area
            processed_df[f'l{i}_crack_area_in_area'] = pd.to_numeric(df[f'L{i} Crack Area (in % area)'], errors='coerce')
            processed_df[f'r{i}_crack_area_in_area'] = pd.to_numeric(df[f'R{i} Crack Area (in % area)'], errors='coerce')
            
            # Ravelling area
            processed_df[f'l{i}_area_area'] = pd.to_numeric(df[f'L{i} Area (% area)'], errors='coerce')
            processed_df[f'r{i}_area_area'] = pd.to_numeric(df[f'R{i} Area (% area)'], errors='coerce')
        
        # Add calculated averages and scores
        score_columns = [
            'avg_roughness_bi', 'avg_rut_depth', 'avg_crack_area', 'avg_ravelling_area',
            'left_avg_roughness_bi', 'right_avg_roughness_bi', 'left_avg_rut_depth', 'right_avg_rut_depth',
            'left_avg_crack_area', 'right_avg_crack_area', 'left_avg_ravelling_area', 'right_avg_ravelling_area',
            'overall_quality_score', 'left_half_quality_score', 'right_half_quality_score',
            'avg_roughness_score', 'avg_rut_score', 'avg_crack_score', 'avg_ravelling_score',
            'left_roughness_score', 'right_roughness_score', 'left_rut_score', 'right_rut_score',
            'left_crack_score', 'right_crack_score', 'left_ravelling_score', 'right_ravelling_score'
        ]
        
        for col in score_columns:
            if col in df.columns:
                processed_df[col] = df[col]
        
        print(f"Processed dataframe created with {len(processed_df)} rows and {len(processed_df.columns)} columns")
        return processed_df
    
    def create_database_schema(self, conn):
        """Create the database schema"""
        print("Creating database schema...")
        
        # Drop existing table if it exists
        conn.execute("DROP TABLE IF EXISTS road_data")
        
        # Create the road_data table with all required columns
        create_table_sql = """
        CREATE TABLE road_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nh_number TEXT,
            start_chainage REAL,
            end_chainage REAL,
            length REAL,
            structure_details TEXT,
            l1_start_latitude REAL,
            l1_start_longitude REAL,
            l1_end_latitude REAL,
            l1_end_longitude REAL,
            l2_start_latitude REAL,
            l2_start_longitude REAL,
            l2_end_latitude REAL,
            l2_end_longitude REAL,
            l3_start_latitude REAL,
            l3_start_longitude REAL,
            l3_end_latitude REAL,
            l3_end_longitude REAL,
            l4_start_latitude REAL,
            l4_start_longitude REAL,
            l4_end_latitude REAL,
            l4_end_longitude REAL,
            r1_start_latitude REAL,
            r1_start_longitude REAL,
            r1_end_latitude REAL,
            r1_end_longitude REAL,
            r2_start_latitude REAL,
            r2_start_longitude REAL,
            r2_end_latitude REAL,
            r2_end_longitude REAL,
            r3_start_latitude REAL,
            r3_start_longitude REAL,
            r3_end_latitude REAL,
            r3_end_longitude REAL,
            r4_start_latitude REAL,
            r4_start_longitude REAL,
            r4_end_latitude REAL,
            r4_end_longitude REAL,
            remark TEXT,
            limitation_of_bi_as_per_morth_circular_in_mm_km REAL,
            l1_lane_roughness_bi_in_mm_km REAL,
            l2_lane_roughness_bi_in_mm_km REAL,
            l3_lane_roughness_bi_in_mm_km REAL,
            l4_lane_roughness_bi_in_mm_km REAL,
            r1_lane_roughness_bi_in_mm_km REAL,
            r2_lane_roughness_bi_in_mm_km REAL,
            r3_lane_roughness_bi_in_mm_km REAL,
            r4_lane_roughness_bi_in_mm_km REAL,
            limitation_of_rut_depth_as_per_concession_agreement_in_mm REAL,
            l1_rut_depth_in_mm REAL,
            l2_rut_depth_in_mm REAL,
            l3_rut_depth_in_mm REAL,
            l4_rut_depth_in_mm REAL,
            r1_rut_depth_in_mm REAL,
            r2_rut_depth_in_mm REAL,
            r3_rut_depth_in_mm REAL,
            r4_rut_depth_in_mm REAL,
            limitation_of_cracking_as_per_concession_agreement_in_area REAL,
            l1_crack_area_in_area REAL,
            l2_crack_area_in_area REAL,
            l3_crack_area_in_area REAL,
            l4_crack_area_in_area REAL,
            r1_crack_area_in_area REAL,
            r2_crack_area_in_area REAL,
            r3_crack_area_in_area REAL,
            r4_crack_area_in_area REAL,
            limitation_of_ravelling_as_per_concession_agreement_in_area REAL,
            l1_area_area REAL,
            l2_area_area REAL,
            l3_area_area REAL,
            l4_area_area REAL,
            r1_area_area REAL,
            r2_area_area REAL,
            r3_area_area REAL,
            r4_area_area REAL,
            overall_quality_score REAL,
            left_half_quality_score REAL,
            right_half_quality_score REAL,
            avg_roughness_score REAL,
            avg_rut_score REAL,
            avg_crack_score REAL,
            avg_ravelling_score REAL,
            left_roughness_score REAL,
            left_rut_score REAL,
            left_crack_score REAL,
            left_ravelling_score REAL,
            right_roughness_score REAL,
            right_rut_score REAL,
            right_crack_score REAL,
            right_ravelling_score REAL,
            avg_roughness_bi REAL,
            avg_rut_depth REAL,
            avg_crack_area REAL,
            avg_ravelling_area REAL,
            left_avg_roughness_bi REAL,
            left_avg_rut_depth REAL,
            left_avg_crack_area REAL,
            left_avg_ravelling_area REAL,
            right_avg_roughness_bi REAL,
            right_avg_rut_depth REAL,
            right_avg_crack_area REAL,
            right_avg_ravelling_area REAL
        )
        """
        
        conn.execute(create_table_sql)
        conn.commit()
        print("Database schema created successfully")
    
    def insert_data(self, df, conn):
        """Insert the processed data into the database"""
        print("Inserting data into database...")
        
        # Replace NaN values with None for proper SQLite handling
        df = df.replace({np.nan: None})
        
        # Insert data using pandas to_sql method
        df.to_sql('road_data', conn, if_exists='append', index=False)
        
        print(f"Successfully inserted {len(df)} rows into the database")
    
    def run_ingestion(self):
        """Run the complete data ingestion process"""
        print("Starting data ingestion process...")
        
        # Load CSV data
        df = self.load_csv_data()
        
        # Calculate quality scores
        df = self.calculate_quality_scores(df)
        
        # Create processed dataframe
        processed_df = self.create_processed_dataframe(df)
        
        # Create database connection
        conn = sqlite3.connect(self.db_path)
        
        try:
            # Create schema
            self.create_database_schema(conn)
            
            # Insert data
            self.insert_data(processed_df, conn)
            
            print("Data ingestion completed successfully!")
            
            # Print some statistics
            print(f"\nDatabase Statistics:")
            print(f"Total segments: {len(processed_df)}")
            print(f"Average quality score: {processed_df['overall_quality_score'].mean():.3f}")
            print(f"Best quality score: {processed_df['overall_quality_score'].max():.3f}")
            print(f"Worst quality score: {processed_df['overall_quality_score'].min():.3f}")
            
        finally:
            conn.close()

def main():
    # Define file paths
    csv_file = "./Comparison Delhi Vadodara Pkg 9 (Road Signage).xlsx -  Comparison with CA@100m.csv"
    db_file = "./data.db"
    
    # Create ingester instance
    ingester = RoadDataIngester(csv_file, db_file)
    
    # Run the ingestion process
    ingester.run_ingestion()

if __name__ == "__main__":
    main()