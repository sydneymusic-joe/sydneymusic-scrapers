#!/usr/bin/env python
# coding: utf-8

# importing required packages, and installing missing packages
import re
import sys
import subprocess
from time import time, sleep
from datetime import timedelta, datetime

def install(package_name):
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', package_name])
    reqs = subprocess.check_output([sys.executable, '-m', 'pip', 'freeze'])
    installed_packages = [r.decode().split('==')[0] for r in reqs.split()]

try:
    import pandas as pd
    import requests
    import lxml
    from bs4 import BeautifulSoup
    from selenium import webdriver
    from selenium.webdriver.firefox.service import Service
    from webdriver_manager.firefox import GeckoDriverManager
except:
    install('pandas')
    import pandas as pd
    install('requests')
    import requests
    install('lxml')
    import lxml
    install('bs4')
    from bs4 import BeautifulSoup
    install('selenium')
    from selenium import webdriver
    from selenium.webdriver.firefox.service import Service
    install('webdriver_manager')
    from webdriver_manager.firefox import GeckoDriverManager
    
# setting up pandas to show all columns
pd.set_option('display.max_columns', None)

# setting up our webdriver 
html = 'file:///Users/joehardy/Sites/sydneymusic-oztix/sydney_music-algolia_template-utm_and_hc_filtering.html'
# html = 'file:///C:/Users/thoma/Documents/GitHub/sydneymusic/oztix_feed/sydneymusic-oztix/sydney_music-algolia_template-utm_and_hc_filtering.html'
driver = webdriver.Firefox(executable_path=r"./geckodriver")
browser =  driver.get(html)
results = []
links = []

# while webpages is open and next page link is clickable
while True:
    
    try:
        sleep(5)
        
        # grab the current web page data
        sdata = driver.page_source
        soup = BeautifulSoup(sdata)
        
        # find all instances of this particular div class
        soup_hits = soup.find_all("div", class_="product-desc-wrapper no-pad-left col-xs-7 col-sm-12")
        soup_hits_links = soup.find_all("div", class_="ais-hits--item event-container col-xs-12 col-sm-6") 

        for item in soup_hits:
            
            # stripping/replacing problematic characters with ~ (hopefully a relatively uncommon char) and remaining html
            soup_stripped = str(item).strip("><").split('sm-12">')[1]
            result = re.sub(r'<.*?>', '~', soup_stripped)
            result = result.strip("</div").replace("&amp;","&")
            
            # removing instacnes of multiple ~ from replacement
            while True:
                result = result.replace("~~","~")
                if "~~" not in result:
                    break
                else:
                    pass
            
            # collecting the results
            results.append(result[1:-1])
            print(result[1:-1])

        for item in soup_hits_links:

            link = str(item).split('href="')[1].split('"')[0]
            links.append(link)
            
        # finding and clicking the next page arrow
        element_xpath = '/html/body/div/div[2]/div/div/div[2]/div/section/div/ul/li[9]/a/em'
        driver.find_element("xpath", element_xpath).click()
        
    except:
        # ending loop if no next page arrow
        break
        
driver.close()

collected_results = zip(results, links)

# cleaning the collected results
rows = []

for result, link in collected_results:
    
    try:
        row = {}
        
        # assuming the year is current year
        date = result[4:10]+"~"+str(datetime.now())[0:4]
        
        # converting to date    
        date = datetime.strptime(date, "%d~%b~%Y")
        
        # assuming that if listing is in the past, it's actually for next year
        if date < datetime.now():
            date += timedelta(weeks = 52)
        else:
            pass
        
        # collecting other elements
        res = result[11:].split("~")
        suburb = res[-1].strip()
        venue = res[-2].strip()
        lineup = result[11:].replace(suburb,'').replace(venue,'').replace('~',' ').strip()
        
        # checking if things are postponed or cancelled
        if 'POSTPONED' in lineup:
            postponed = True
            cancelled = False
            lineup = lineup.replace('POSTPONED - ','')
        elif 'CANCELLED' in lineup:
            postponed = False
            cancelled = True
            lineup = lineup.replace('CANCELLED - ','')
        else:
            postponed = False
            cancelled = False   
        
        # adding these new variables to our new row dictionary
        row['date'] = date
        row['venue'] = venue
        row['suburb'] = suburb
        row['lineup'] = lineup
        row['cancelled'] = cancelled
        row['postponed'] = postponed
        row['link'] = link
        
        # appending that to our future dataframe
        rows.append(row)
        
        # checking if things are working
        print(date, "/", venue, "/", suburb, "/", lineup, "/", postponed, "/", cancelled, "/", link)
    except:
        pass
    
# converting to dataframe
df = pd.DataFrame(rows)
df['record_created'] = datetime.now()
df

# exporting to csv
export_filename = './output.csv'
df.to_csv(export_filename)
print('Exported:', export_filename)
